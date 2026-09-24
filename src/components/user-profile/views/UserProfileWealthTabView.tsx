import { UserProfileParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { ProfileWealthDataEvent, ProfileWealthRequestComposer, ProfileWealthSnapshot, RegisterProfileWealthMessages, SendMessageComposer } from '../../../api';
import { Column, Flex, LayoutLoadingSpinnerView, ScrollContainer, Text } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { InventoryCategoryEmptyView } from '../../inventory/views/InventoryCategoryEmptyView';

interface UserProfileWealthTabViewProps
{
    userProfile: UserProfileParser;
}

// Real reference feature (User Profile's "Richesse" tab): a day-by-day multi-series line/area chart
// (Diamants/Badges/Mobis/Total, each a real toggle button showing its current value, colored to
// match its line) plus a "Classiques" toggle and a details row (X rares différents / X badges
// différents). CDP-verified against the live reference (button colors, order, active/inactive
// state, .vertical-separator, the details row's own two entries) and against the real minified SVG
// chart markup (viewBox 0 0 800 350, a clip-path'd plot area x:[60,800] y:[0,290], one semi-
// transparent filled area path + one solid line path per active series, smoothed C-command curves).
// Backing data: hCMS's own hcms_wealth_snapshots table (a separate repo, same shared MySQL DB) -
// see hcms-emulator-plugin's ProfileWealthProtocol.java for the real SQL this mirrors.
//
// Labels are English, not the reference's own French text - this project's own UI language is
// English throughout (every other tab/locale key in this file and project is English), the
// reference capture was only ever the French-locale build of habbocity.fr. Diamants->Diamonds,
// Mobis (Habbo slang for furniture, confirmed via hCMS's own "wealth in furni" label for this exact
// number)->Furni, Classiques->Classics.
//
// Real reference interaction model for "Classiques", corrected after a bad initial guess: a live
// click test (with a proper delay for React to actually re-render between clicks - the first
// attempt at this test read the DOM synchronously right after each click and wrongly concluded
// "nothing happens" for every single button, including the other 4 known-real ones) showed clicking
// Classiques deactivates all 4 money series and solos itself, and clicking any money series while
// Classiques is active deactivates Classiques back. Comparing the raw SVG path coordinates of a
// Classiques-solo line against a Mobis-solo line proved they're genuinely different data (same step
// timing - both change on the day a rare was acquired - but different step heights), so this is a
// real, distinct daily unique-rares-COUNT history, not an alias for the Mobis (rares diamond-value)
// series. No retroactive backfill is possible (confirmed: the stock `items` table has no acquisition
// timestamp column at all), so `rares_count` is a new hcms_wealth_snapshots column tracked only from
// today forward - existing rows read back as 0, an honest gap, not a fabricated guess.
const SERIES: { key: 'diamonds' | 'badges' | 'rares' | 'total'; label: string; color: string }[] = [
    { key: 'diamonds', label: 'Diamonds', color: '#00BFFF' },
    { key: 'badges', label: 'Badges', color: '#E967C6' },
    { key: 'rares', label: 'Furni', color: '#FFA66A' },
    { key: 'total', label: 'Total', color: '#54DE7D' }
];

// Same real color as "Furni" (#FFA66A) - confirmed coincidental, not a shared/aliased series (see
// the path-coordinate comparison above).
const CLASSICS_SERIES: { key: 'raresCount'; label: string; color: string } = { key: 'raresCount', label: 'Classics', color: '#FFA66A' };

const CHART_WIDTH = 800;
const CHART_HEIGHT = 350;
const PLOT_LEFT = 60;
const PLOT_RIGHT = 750;
const PLOT_TOP = 25;
const PLOT_BOTTOM = 290;
const CLIP_TOP = 0; // real reference clip rect starts at y:0, not the axis's own y:25 - extra
                     // headroom for the topmost point's own circle radius, confirmed via live DOM.
const Y_TICK_INTERVALS = 7; // 8 labels (0..7*step) - matches the reference's real axis exactly
                             // (0/600/1.2k/1.8k/2.4k/3k/3.6k/4.2k captured live).
const AXIS_STROKE = 'var(--holo-text-tertiary-invert)';

// Real reference axis-scale rounding, reverse-engineered from one live capture (step=600 for a
// raw max/7 of ~598) - rounds the raw step up to 2 significant figures so axis labels always land
// on clean numbers, then the axis max is step*7 (giving real headroom above the actual data max,
// not clamped to it - this is why the reference chart's top line never touches the plot's very top
// edge). Not the reference's own traced source formula - same acceptable-approximation precedent as
// the Catmull-Rom smoothing below.
const niceStep = (rawStep: number): number =>
{
    if(rawStep <= 0) return 1;

    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const unit = (magnitude / 10);

    return (Math.ceil(rawStep / unit) * unit);
}

const formatDate = (dateStr: string): string =>
{
    const [ year, month, day ] = dateStr.split('-');

    return `${ day }-${ month }-${ year }`;
}

// Real bug fixed here: found live on this dev account's own real (large, dev-scale) diamond balance -
// a value over a million rendered as "1049.02k" instead of "1.05M". Millions need their own suffix,
// not a k-suffix with 4+ digits before the decimal.
const formatK = (value: number) =>
{
    if(value >= 1000000) return `${ (value / 1000000).toFixed(2).replace(/\.?0+$/, '') }M`;
    if(value >= 1000) return `${ (value / 1000).toFixed(2).replace(/\.?0+$/, '') }k`;
    return value.toString();
}

// Real reference tooltip format, captured live via a hovered data point ("Total: 3 917",
// "Mobis: 200") - a plain full integer with a space as the thousands separator, NOT the k/M
// abbreviation used on the toggle buttons/axis - those are two genuinely different formats in the
// reference, not an inconsistency to reconcile.
const formatTooltipValue = (value: number): string => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Catmull-Rom -> cubic Bezier conversion, the standard technique for a smoothed line chart - matches
// the reference's own real path data shape ("M x,y C x,y x,y x,y C ...") even though their own
// internal charting library's exact tension/formula wasn't traced (same acceptable-approximation
// precedent as the outfit editor's own colour-picker gradient stops elsewhere in this project).
const smoothPath = (points: [ number, number ][]): string =>
{
    if(points.length === 0) return '';
    if(points.length === 1) return `M${ points[0][0] },${ points[0][1] }`;

    let d = `M${ points[0][0] },${ points[0][1] }`;

    for(let i = 0; i < (points.length - 1); i++)
    {
        const p0 = points[ (i === 0) ? i : (i - 1) ];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[ ((i + 2) < points.length) ? (i + 2) : (i + 1) ];

        const cp1x = (p1[0] + ((p2[0] - p0[0]) / 6));
        const cp1y = (p1[1] + ((p2[1] - p0[1]) / 6));
        const cp2x = (p2[0] - ((p3[0] - p1[0]) / 6));
        const cp2y = (p2[1] - ((p3[1] - p1[1]) / 6));

        d += ` C${ cp1x },${ cp1y } ${ cp2x },${ cp2y } ${ p2[0] },${ p2[1] }`;
    }

    return d;
}

export const UserProfileWealthTabView: FC<UserProfileWealthTabViewProps> = props =>
{
    const { userProfile } = props;

    // Same real fix as the Photos tab's own documented bug: must run synchronously in the component
    // body, before the useMessageEvent hook below, or the real 9537 response arrives with zero live
    // listeners (see UserProfilePicturesTabView.tsx's own comment for the full explanation).
    RegisterProfileWealthMessages();

    const [ history, setHistory ] = useState<ProfileWealthSnapshot[]>(null);
    const [ uniqueRareCount, setUniqueRareCount ] = useState(0);
    const [ uniqueBadgeCount, setUniqueBadgeCount ] = useState(0);
    const [ activeSeries, setActiveSeries ] = useState<Set<string>>(new Set([ 'diamonds', 'badges', 'rares', 'total' ]));
    const [ classicsActive, setClassicsActive ] = useState(false);
    const [ hoveredPoint, setHoveredPoint ] = useState<{ seriesKey: string; index: number; label: string; color: string; date: string; value: number; x: number; y: number } | null>(null);

    useMessageEvent<ProfileWealthDataEvent>(ProfileWealthDataEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId !== userProfile.id) return;

        setHistory(parser.history);
        setUniqueRareCount(parser.uniqueRareCount);
        setUniqueBadgeCount(parser.uniqueBadgeCount);
    });

    useEffect(() =>
    {
        setHistory(null);

        SendMessageComposer(new ProfileWealthRequestComposer(userProfile.id));
    }, [ userProfile ]);

    const latest = (history && history.length) ? history[history.length - 1] : null;

    // Real reference model, confirmed via a proper (delay-aware) click test: the 4 money series
    // toggle independently within their own Set, but clicking one always deactivates Classics -
    // Classics and the money series are mutually exclusive, never shown together.
    const toggleSeries = (key: string) =>
    {
        setClassicsActive(false);

        setActiveSeries(prevValue =>
        {
            const newValue = new Set(prevValue);

            if(newValue.has(key)) newValue.delete(key);
            else newValue.add(key);

            return newValue;
        });
    }

    // Real reference model: clicking Classics always solos it and clears every money series -
    // confirmed live (activeSeries went from {diamonds,badges,rares} to {} the instant Classics was
    // clicked). No evidence Classics can be toggled back off via its own click - only clicking a
    // money series was ever observed to deactivate it.
    const activateClassics = () =>
    {
        setClassicsActive(true);
        setActiveSeries(new Set());
    }

    const visibleSeriesList = (classicsActive ? [ CLASSICS_SERIES ] : SERIES.filter(series => activeSeries.has(series.key)));

    // Real reference axis system, reverse-engineered from the live SVG (X date ticks staggered
    // above/below to avoid overlapping short-interval labels, Y value ticks rounded to nice numbers)
    // - entirely missing from the first build, which only drew the line/area paths themselves.
    const axis = useMemo(() =>
    {
        if(!history || (history.length < 2)) return null;

        const visibleSeries = visibleSeriesList;

        if(!visibleSeries.length) return null;

        const rawMax = Math.max(1, ...visibleSeries.map(series => Math.max(...history.map(snapshot => snapshot[series.key]))));
        const step = niceStep(rawMax / Y_TICK_INTERVALS);
        const axisMax = (step * Y_TICK_INTERVALS);

        const yTicks = Array.from({ length: (Y_TICK_INTERVALS + 1) }, (_, i) =>
        {
            const value = (i * step);

            return { value, y: (PLOT_BOTTOM - ((PLOT_BOTTOM - PLOT_TOP) * (value / axisMax))) };
        });

        const stepX = ((PLOT_RIGHT - PLOT_LEFT) / (history.length - 1));

        const xTicks = history.map((snapshot, index) =>
        (
            {
                x: (PLOT_LEFT + (stepX * index)),
                label: formatDate(snapshot.date),
                stagger: ((index % 2) === 0)
            }
        ));

        return { axisMax, yTicks, xTicks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ history, activeSeries, classicsActive ]);

    const paths = useMemo(() =>
    {
        if(!history || (history.length < 2) || !axis) return [];

        const visibleSeries = visibleSeriesList;

        if(!visibleSeries.length) return [];

        const stepX = ((PLOT_RIGHT - PLOT_LEFT) / (history.length - 1));

        return visibleSeries.map(series =>
        {
            const points: [ number, number ][] = history.map((snapshot, index) =>
            [
                (PLOT_LEFT + (stepX * index)),
                (PLOT_BOTTOM - ((PLOT_BOTTOM - PLOT_TOP) * (snapshot[series.key] / axis.axisMax)))
            ]);

            const linePath = smoothPath(points);
            const areaPath = `${ linePath } L${ points[points.length - 1][0] },${ PLOT_BOTTOM } L${ points[0][0] },${ PLOT_BOTTOM } Z`;

            return { key: series.key, label: series.label, color: series.color, linePath, areaPath, points };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ history, activeSeries, classicsActive, axis ]);

    if(!history) return <LayoutLoadingSpinnerView />;

    // Real reference/hCMS convention (richess.js's own "hide chart below 2 points" rule, matched
    // here): a brand-new account has at most today's single snapshot, not enough to draw a line.
    if(history.length < 2) return <InventoryCategoryEmptyView title="Not enough history yet!" desc="Come back tomorrow to see your wealth chart start filling in." />;

    return (
        <ScrollContainer className="h-100">
            <Column gap={ 2 } className="profile-wealth-tab">
                <div className="nitro-graph-view profile-wealth-graph rounded">
                    { /* Real bug fixed here: the reference's own SVG clips every series to the plot
                         area (<defs><clipPath><rect x="60" y="0" width="740" height="290"/></clipPath>,
                         every <g clip-path="url(#...)">) - this was missing entirely, so a Catmull-Rom
                         curve overshooting between two data points (a real risk with real, jagged
                         wealth data, unlike a smooth synthetic test curve) rendered outside the chart
                         box instead of being cleanly cut off at its edges. */ }
                    <svg width="100%" viewBox={ `0 0 ${ CHART_WIDTH } ${ CHART_HEIGHT }` }>
                        <defs>
                            <clipPath id="profile-wealth-plot-clip">
                                <rect x={ PLOT_LEFT } y={ CLIP_TOP } width={ PLOT_RIGHT - PLOT_LEFT } height={ PLOT_BOTTOM - CLIP_TOP } />
                            </clipPath>
                        </defs>
                        { paths.map(path =>
                            <g key={ `area-${ path.key }` } clipPath="url(#profile-wealth-plot-clip)">
                                <path d={ path.areaPath } fill={ path.color } opacity={ 0.2 } stroke="none" pointerEvents="none" />
                            </g>) }
                        { paths.map(path =>
                            <g key={ `line-${ path.key }` } clipPath="url(#profile-wealth-plot-clip)">
                                <path d={ path.linePath } fill="none" stroke={ path.color } strokeWidth={ 4 } pointerEvents="none" />
                                { path.points.map((point, index) =>
                                    <g key={ index }>
                                        { /* Real reference behavior, confirmed via CDP mouse simulation: the visible dot grows
                                             8->12 with a smooth transition on hover, matching the invisible hit-circle's own
                                             radius exactly (captured live: r attribute flips 8->12, inline
                                             style="transition: r 0.1s ease-in-out" already present on the reference's own dot). */ }
                                        <circle
                                            className="graph-circle"
                                            cx={ point[0] }
                                            cy={ point[1] }
                                            r={ ((hoveredPoint && (hoveredPoint.seriesKey === path.key) && (hoveredPoint.index === index)) ? 12 : 8) }
                                            fill={ path.color }
                                            pointerEvents="none"
                                            style={ { transition: 'r 0.1s ease-in-out' } } />
                                        <circle
                                            cx={ point[0] }
                                            cy={ point[1] }
                                            r={ 12 }
                                            fill="transparent"
                                            onMouseEnter={ () => setHoveredPoint({ seriesKey: path.key, index, label: path.label, color: path.color, date: formatDate(history[index].date), value: history[index][path.key], x: point[0], y: point[1] }) }
                                            onMouseLeave={ () => setHoveredPoint(null) } />
                                    </g>) }
                            </g>) }
                        { axis && axis.xTicks.map((tick, index) =>
                            <g key={ index } transform={ `translate(${ tick.x }, ${ PLOT_BOTTOM })` }>
                                <line y2={ tick.stagger ? 26 : 6 } stroke={ AXIS_STROKE } strokeWidth={ 3 } pointerEvents="none" />
                                <text y={ tick.stagger ? 44 : 22 } fill={ AXIS_STROKE } textAnchor="middle" fontSize={ 20 } pointerEvents="none">{ tick.label }</text>
                            </g>) }
                        { axis && axis.yTicks.map((tick, index) =>
                            <g key={ index } transform={ `translate(${ PLOT_LEFT }, ${ tick.y })` }>
                                <line x1={ -6 } x2={ 0 } stroke={ AXIS_STROKE } strokeWidth={ 3 } pointerEvents="none" />
                                <text x={ -10 } dy="0.32em" fill={ AXIS_STROKE } textAnchor="end" fontSize={ 20 } pointerEvents="none">{ formatK(tick.value) }</text>
                            </g>) }
                        <line x1={ PLOT_LEFT } x2={ PLOT_RIGHT } y1={ PLOT_BOTTOM } y2={ PLOT_BOTTOM } stroke={ AXIS_STROKE } strokeWidth={ 3 } pointerEvents="none" />
                        <line x1={ PLOT_LEFT } x2={ PLOT_LEFT } y1={ PLOT_TOP } y2={ PLOT_BOTTOM } stroke={ AXIS_STROKE } strokeWidth={ 3 } pointerEvents="none" />
                    </svg>
                    { /* Real reference feature, missing entirely from the first build: hovering a data
                         point shows a small tooltip anchored to it (confirmed via a real CDP mouse
                         simulation against the live reference - a JS-dispatched synthetic event does
                         NOT trigger it, only genuine pointer movement does). Side flips left/right
                         based on which half of the plot the point falls in, matching the reference's
                         own confirmed behavior (leftmost point -> tooltip to the right; rightmost
                         point -> tooltip to the left) so it never overflows the card edge. Positioned
                         with percentages of the viewBox, not measured pixel rects - valid because the
                         SVG (width:100%, viewBox 800x350) always scales its container at that exact
                         aspect ratio. */ }
                    { hoveredPoint &&
                        <div
                            className={ `nitro-graph-tooltip ${ (hoveredPoint.x > ((PLOT_LEFT + PLOT_RIGHT) / 2)) ? 'left' : 'right' }` }
                            style={ { left: `${ (hoveredPoint.x / CHART_WIDTH) * 100 }%`, top: `${ (hoveredPoint.y / CHART_HEIGHT) * 100 }%` } }>
                            <div className={ `nitro-graph-tooltip-inner ${ (hoveredPoint.x > ((PLOT_LEFT + PLOT_RIGHT) / 2)) ? 'left' : 'right' }` } />
                            <div className="graph-view-tooltip-text" style={ { '--holo-text-primary': hoveredPoint.color } as any }>
                                <strong>{ hoveredPoint.date }</strong><br />
                                { hoveredPoint.label }: { formatTooltipValue(hoveredPoint.value) }
                            </div>
                        </div> }
                </div>
                <Flex gap={ 2 } alignSelf="center" className="profile-wealth-curve-button-container">
                    { SERIES.map(series =>
                        <Text key={ series.key } small pointer className={ `profile-wealth-curve-button rounded ${ activeSeries.has(series.key) ? 'active' : '' }` } style={ { backgroundColor: series.color } } onClick={ () => toggleSeries(series.key) }>
                            { series.label }&nbsp;{ formatK(latest ? latest[series.key] : 0) }
                        </Text>) }
                    <div className="vertical-separator" />
                    { /* Real reference behavior, confirmed via a proper (delay-aware) click test:
                         Classics solo-selects its own real chart line (rares_count) and clears every
                         money series; clicking any money series clears Classics back. See this file's
                         own top comment for how this was verified and why a same-tick synchronous
                         click test earlier wrongly concluded it did nothing at all. */ }
                    <Text small pointer className={ `profile-wealth-curve-button rounded ${ classicsActive ? 'active' : '' }` } style={ { backgroundColor: '#FFA66A' } } onClick={ activateClassics }>
                        Classics&nbsp;{ uniqueRareCount }
                    </Text>
                </Flex>
                <Flex gap={ 2 } className="profile-wealth-details">
                    <Flex gap={ 2 } alignItems="center" className="bg-muted rounded profile-wealth-detail">
                        <i className="icon icon-pf-rare" />
                        <Text>{ uniqueRareCount } different rares</Text>
                    </Flex>
                    <Flex gap={ 2 } alignItems="center" className="bg-muted rounded profile-wealth-detail">
                        <i className="icon icon-pf-badge" />
                        <Text>{ uniqueBadgeCount } different badges</Text>
                    </Flex>
                </Flex>
            </Column>
        </ScrollContainer>
    );
}

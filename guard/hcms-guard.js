(function (w, d, l) {
    var home = 'https://habbo.nz';
    var dev = (l.hostname === 'localhost') || (l.hostname === '127.0.0.1');
    var query = new URLSearchParams(l.search);

    function own(host) {
        return /(^|\.)habbo\.nz$/.test(host) || (host === 'localhost') || (host === '127.0.0.1');
    }

    function leave() {
        l.replace(home);
    }

    function machine() {
        var source = '';

        try {
            var canvas = d.createElement('canvas');
            var context = canvas.getContext('2d');

            context.textBaseline = 'top';
            context.font = '14px Arial';
            context.fillStyle = '#f60';
            context.fillRect(0, 0, 80, 20);
            context.fillStyle = '#069';
            context.fillText('Habbo.nz ☃', 2, 2);
            source = canvas.toDataURL();
        } catch (e) {
        }

        source += [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency, navigator.platform].join('|');

        var a = 2166136261;
        var b = 5381;

        for (var i = 0; i < source.length; i++) {
            a = Math.imul(a ^ source.charCodeAt(i), 16777619);
            b = Math.imul(b, 33) ^ source.charCodeAt(i);
        }

        return ((a >>> 0).toString(16) + (b >>> 0).toString(16)).padStart(16, '0');
    }

    function block(fresh) {
        var target = 'https://dev.habbo.nz/blocked?m=' + machine() + (fresh ? '&r=1' : '');

        try {
            w.parent.postMessage({ type: 'hcms:blocked', url: target }, '*');
        } catch (e) {
        }

        l.replace(target);
    }

    if (/(^|;\s*)hcms_b=\d+/.test(d.cookie)) return block(false);

    if (!own(l.hostname)) return leave();

    var ancestors = l.ancestorOrigins;

    if (ancestors) {
        for (var i = 0; i < ancestors.length; i++) {
            if (!own(new URL(ancestors[i]).hostname)) return leave();
        }
    }

    if (!dev) {
        if (w.top === w) return leave();
        if (ancestors && !ancestors.length) return leave();
        if (!/^hcms-[a-f0-9]{48}$/.test(query.get('sso') || '')) return leave();
    }

    w.__hg = 'hcms-' + (l.hostname.length * 7919);

    function ticket() {
        var url = query.get('sso') || null;

        try {
            var saved = JSON.parse(w.sessionStorage.getItem('hcms:reconnect') || 'null');

            if (saved && saved.ticket && (saved.urlTicket === url) && (w.sessionStorage.getItem('hcms:reconnect-try') !== saved.ticket)) {
                w.sessionStorage.setItem('hcms:reconnect-try', saved.ticket);

                return saved.ticket;
            }
        } catch (e) {
        }

        return url;
    }

    w.NitroConfig = {
        'config.urls': ['/renderer-config.json?v=20261004j', '/ui-config.json?v=20261004i'],
        'sso.ticket': ticket(),
        'forward.type': (query.get('room') ? 2 : -1),
        'forward.id': (query.get('room') || 0),
        'friend.id': (query.get('friend') || 0)
    };

    function banner() {
        if (query.get('ad') !== '1') return;

        var ticket = query.get('sso') || '';

        try {
            if (w.sessionStorage.getItem('hcms:ad-ticket') === ticket) return;

            w.sessionStorage.setItem('hcms:ad-ticket', ticket);
        } catch (e) {
        }

        var cdn = 'https://cdn.habbo.nz/room-enter-ad/';
        var ad = d.createElement('div');

        ad.style.cssText = 'left:50%;margin-left:-370px;margin-top:-30px;position:fixed;height:195px;width:740px;background-image:url(' + cdn + 'frame.png);background-repeat:no-repeat;z-index:99999';
        ad.innerHTML = '<div style="position:absolute;left:6px;top:76px;color:#fff;font-size:10px;font-family:Verdana,sans-serif">Ad closes in <b>60</b> seconds</div>'
            + '<div style="position:absolute;left:721px;bottom:105px;font-weight:bold;font-size:10px;z-index:999999;font-family:Verdana,sans-serif;cursor:pointer"><a style="color:red">X</a></div>'
            + '<div style="position:absolute;left:6px;top:91px"><div style="text-align:center"><div style="width:728px;height:90px"><img src="' + cdn + 'beta.png?v=2" alt=""></div></div></div>';

        d.body.appendChild(ad);

        var timer = ad.children[0];
        var left = 60;
        var hide = function () {
            clearInterval(counter);
            ad.remove();
        };
        var counter = setInterval(function () {
            if (left <= 0) return hide();

            timer.innerHTML = 'Ad closes in <b>' + left + '</b> seconds';
            left--;
        }, 1000);

        ad.children[1].onclick = hide;
    }

    banner();

    if (dev) return;

    function staff() {
        try {
            return !!w.__hs;
        } catch (e) {
            return false;
        }
    }

    w.addEventListener('keydown', function (event) {
        if (staff()) return;

        var key = (event.key || '').toLowerCase();
        var mod = event.ctrlKey || event.metaKey;

        if ((key === 'f12') || (mod && event.shiftKey && ['i', 'j', 'c', 'k'].indexOf(key) > -1) || (mod && (key === 'u'))) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    var trap = new Function(['de', 'bug', 'ger'].join(''));

    setInterval(function () {
        if (staff()) return;

        if (d.hidden) return;

        var started = performance.now();

        trap();

        if ((performance.now() - started) > 1000) block(true);
    }, 1000);
})(window, document, location);

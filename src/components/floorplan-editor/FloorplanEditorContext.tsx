import { createContext, Dispatch, FC, ProviderProps, SetStateAction, useContext } from 'react';
import { IFloorplanSettings } from './common/IFloorplanSettings';
import { IVisualizationSettings } from './common/IVisualizationSettings';

// The same shared state as sodaho.tel's floor editor context (their `fae`): settings, the chosen height and tool,
// pan / square-select mode, a counter that changes on every tilemap change, and the tile count for the panel header.
interface IFloorplanEditorContext
{
    originalFloorplanSettings: IFloorplanSettings;
    setOriginalFloorplanSettings: Dispatch<SetStateAction<IFloorplanSettings>>;
    visualizationSettings: IVisualizationSettings;
    setVisualizationSettings: Dispatch<SetStateAction<IVisualizationSettings>>;
    floorHeight: number;
    setFloorHeight: Dispatch<SetStateAction<number>>;
    floorAction: number;
    setFloorAction: Dispatch<SetStateAction<number>>;
    isPanMode: boolean;
    setIsPanMode: Dispatch<SetStateAction<boolean>>;
    isSquareSelect: boolean;
    setIsSquareSelect: Dispatch<SetStateAction<boolean>>;
    tilemapVersion: number;
    areaInfo: { total: number, walkable: number };
}

const FloorplanEditorContext = createContext<IFloorplanEditorContext>({
    originalFloorplanSettings: null,
    setOriginalFloorplanSettings: null,
    visualizationSettings: null,
    setVisualizationSettings: null,
    floorHeight: 0,
    setFloorHeight: null,
    floorAction: 3,
    setFloorAction: null,
    isPanMode: false,
    setIsPanMode: null,
    isSquareSelect: false,
    setIsSquareSelect: null,
    tilemapVersion: 0,
    areaInfo: { total: 0, walkable: 0 }
});

export const FloorplanEditorContextProvider: FC<ProviderProps<IFloorplanEditorContext>> = props => <FloorplanEditorContext.Provider { ...props } />;

export const useFloorplanEditorContext = () => useContext(FloorplanEditorContext);

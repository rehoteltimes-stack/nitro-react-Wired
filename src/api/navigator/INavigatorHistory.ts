export interface INavigatorHistoryEntry
{
    roomId: number;
    roomName: string;
    date: Date;
    index: number;
}

export interface INavigatorHistory
{
    index: number;
    history: INavigatorHistoryEntry[];
}

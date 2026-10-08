const STACK_TOPS = new Map<number, number>();

export const SetRanchStackTop = (roomIndex: number, top: number) =>
{
    if(top === null) STACK_TOPS.delete(roomIndex);
    else STACK_TOPS.set(roomIndex, top);
}

export const GetRanchStackTop = (roomIndex: number) => STACK_TOPS.get(roomIndex) ?? null;

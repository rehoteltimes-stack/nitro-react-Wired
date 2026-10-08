const FRAME_BUDGET_MS = 6;
const tasks: Map<unknown, () => void> = new Map();
let frame = 0;

const run = () =>
{
    const start = performance.now();

    frame = 0;

    for(const [ key, task ] of tasks)
    {
        tasks.delete(key);
        task();

        if((performance.now() - start) >= FRAME_BUDGET_MS) break;
    }

    if(tasks.size) frame = requestAnimationFrame(run);
}

export const QueueAvatarEditorTask = (key: unknown, task: () => void) =>
{
    tasks.set(key, task);

    if(!frame) frame = requestAnimationFrame(run);
}

export class LocalStorageKeys
{
    public static CATALOG_PLACE_MULTIPLE_OBJECTS: string = 'catalogPlaceMultipleObjects';
    public static CATALOG_SKIP_PURCHASE_CONFIRMATION: string = 'catalogSkipPurchaseConfirmation';
    // Real reference key names, verbatim (including their own "treshold" spelling) - confirmed live
    // via the minified bundle's own localStorage.setItem calls, not guessed. Purely a client-side
    // rendering preference on the reference (never sent to their server) - see
    // UserSettingsFloorView.tsx's own comment for why this project's server-side composer isn't used.
    public static FLOOR_STAIRS_TRESHOLD: string = 'nitro.floorStairsTreshold';
    public static FLOOR_RECT_TRESHOLD: string = 'nitro.floorRectTreshold';
    public static FLOOR_SIZE_TRESHOLD: string = 'nitro.floorSizeTreshold';
}

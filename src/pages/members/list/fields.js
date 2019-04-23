/**
 * “Enum” of sorting types.
 */
export const Sorting = {
    NONE: 0,
    DESC: 1,
    ASC: 2,
};

/**
 * “Enum” of position hints for the flex layout.
 */
export const PosHint = {
    LEFT: 0,
    NAME: 1,
    CENTER: 2,
    RIGHT: 3,
};

/** Position in the detail view. */
export const DetailPos = {
    NONE: -1,
    TITLE: 0,
    TABLE: 1,
};

// TODO: order fields in some sensible order

/**
 * List of all member fields.
 *
 * - weight: inherent priority of the field, e.g. when picking which field gets the LEFT slot
 *   in the flex layout
 * - colWeight: abstract width of the field in the table layout
 * - posHint: preferred position in the flex layout
 * - sortable: whether or not the field should have a sorting control
 * - omitTHead/permanent: special flags that omit the table header or mark the field as
 *   permanent, hiding it from the field picker
 */
export const FIELDS = {
    codeholderType: {
        weight: 1,
        fixedColWidth: 56,
        posHint: PosHint.LEFT,
        omitTHead: true,
        permanent: true,
        sortable: true,
        detailPos: DetailPos.TITLE,
    },
    honorific: {
        weight: 1,
        colWeight: 1,
        posHint: PosHint.NAME,
        detailPos: DetailPos.NAME,
    },
    name: {
        weight: 3,
        colWeight: 2,
        posHint: PosHint.NAME,
        sortable: true,
        detailPos: DetailPos.TITLE,
    },
    code: {
        weight: 2,
        colWeight: 2,
        posHint: PosHint.NAME,
        sortable: true,
        detailPos: DetailPos.TABLE,
    },
    enabled: {
        weight: 1,
        colWeight: 1,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    age: {
        weight: 2,
        colWeight: 2,
        posHint: PosHint.RIGHT,
        sortable: true,
        detailPos: DetailPos.TABLE,
    },
    birthdate: {
        weight: 2,
        colWeight: 2,
        posHint: PosHint.CENTER,
        sortable: true,
        detailPos: DetailPos.TABLE,
    },
    email: {
        weight: 2,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    addressLatin: {
        weight: 1,
        colWeight: 3,
        posHint: PosHint.CENTER,
        sortable: true,
        detailPos: DetailPos.TABLE,
    },
    addressCity: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        sortable: true,
        detailPos: DetailPos.NONE,
    },
    addressCountryArea: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        sortable: true,
        detailPos: DetailPos.NONE,
    },
    country: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.RIGHT,
        sortable: true,
        detailPos: DetailPos.TABLE,
    },
    officePhone: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    cellphone: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    landlinePhone: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    isDead: {
        weight: 1,
        colWeight: 1,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    profession: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
    notes: {
        weight: 1,
        colWeight: 2,
        posHint: PosHint.CENTER,
        detailPos: DetailPos.TABLE,
    },
};

/** List of all field names. */
export const AVAILABLE_FIELDS = Object.keys(FIELDS);
/** List of permanent field names. */
export const PERMANENT_FIELDS = AVAILABLE_FIELDS.filter(field => FIELDS[field].permanent);
/** List of sortable field names. */
export const SORTABLE_FIELDS = AVAILABLE_FIELDS.filter(field => FIELDS[field].sortable);

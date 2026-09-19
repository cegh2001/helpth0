export type IdGenerator = () => string;

export const generateEntityId: IdGenerator = () => globalThis.crypto.randomUUID();
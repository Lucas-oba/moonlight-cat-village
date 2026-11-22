const noop: any = new Proxy({}, { get: () => () => {} });
export const sfx = noop; export const music = noop; export const settings = { music: false, sfx: false, vol: 0 };
export const saveSettings = () => {}; export const ac = null; export const buses = {}; export const onUnlock = () => {}; export const loadBuf = async () => null;

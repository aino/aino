export const addTrailingSlash = (str) => (!/\/$/.test(str) ? `${str}/` : str)
export const removeTrailingSlash = (str) => str.replace(/\/$/, '')

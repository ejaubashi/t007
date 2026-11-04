// Vite supplies '/' locally and '/t007/' for the GitHub Pages build.
export const basePath = import.meta.env.BASE_URL;
export const siteUrl = path => basePath + path.replace(/^\//, '');
export const imageUrl = name => siteUrl('/images/' + name);
export const currentPath = () => {
  const path = location.pathname;
  return path.startsWith(basePath) ? '/' + path.slice(basePath.length) : path;
};

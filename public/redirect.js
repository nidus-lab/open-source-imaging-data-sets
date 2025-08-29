(function () {
    // Try to infer base path dynamically for project pages
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const basePath = pathParts.length > 0 ? `/${pathParts[0]}` : '';
    const currentPath = window.location.pathname;

    // Remove the base path from the current path to get the actual route
    const route = currentPath.replace(basePath, "");

    // Redirect to the root with the route as a parameter
    window.location.href = `${basePath}/?currentRoute=${route.slice(1)}`;
})();
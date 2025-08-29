(function () {
    const basePath = "/open-source-imaging-data-sets";
    const currentPath = window.location.pathname;

    // Remove the base path from the current path to get the actual route
    const route = currentPath.replace(basePath, "");

    // Redirect to the root with the route as a parameter
    window.location.href = `${basePath}/?currentRoute=${route.slice(1)}`;
})();
/* Canonical, Open Graph et Twitter : URL absolues pour l'indexation.
   La navigation du site reste en chemins relatifs. */
(function () {
    function abs(href) {
        try {
            return new URL(href || './', location.href).href;
        } catch (e) {
            return href;
        }
    }

    function isRelative(value) {
        return value && !/^(https?:|data:|\/\/)/i.test(value);
    }

    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) {
        canon.setAttribute('href', abs(canon.getAttribute('href') || './'));
    }

    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', abs(ogUrl.getAttribute('content') || './'));
    }

    [
        ['meta[property="og:image"]', 'content'],
        ['meta[name="twitter:image"]', 'content']
    ].forEach(function (pair) {
        var el = document.querySelector(pair[0]);
        if (!el) return;
        var value = el.getAttribute(pair[1]);
        if (isRelative(value)) {
            el.setAttribute(pair[1], abs(value));
        }
    });
})();

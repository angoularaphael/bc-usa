/* Passe les URL canoniques et Open Graph en absolu, quel que soit l’hébergement. */
(function () {
    var origin = window.location.origin;
    var path = window.location.pathname;
    var pageUrl = origin + path;

    function abs(href) {
        if (!href) return href;
        try {
            return new URL(href, pageUrl).href;
        } catch (e) {
            return href;
        }
    }

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = pageUrl;

    function setProp(key, val) {
        var el = document.querySelector('meta[property="' + key + '"]');
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', val);
    }

    setProp('og:url', pageUrl);

    ['og:image', 'twitter:image'].forEach(function (key) {
        var sel = key.indexOf('twitter') === 0
            ? 'meta[name="' + key + '"]'
            : 'meta[property="' + key + '"]';
        var el = document.querySelector(sel);
        if (el) el.setAttribute('content', abs(el.getAttribute('content')));
    });
})();

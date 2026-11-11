window.__ModuleLoader__.load({
  id: 'dsh-reply-language',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')
    const ReactDOM = require('react-dom')

    const AUTO_ID = 'auto'
    const CONFIG_PATH = '/dsh-reply-language/config'
    const SOURCE_KIND = 'reply-language'
    const CLASS_ROOT = 'dshrl-root'
    const CLASS_TRIGGER = 'dshrl-trigger'
    const CLASS_TRIGGER_ACTIVE = 'dshrl-triggerActive'
    const CLASS_LABEL = 'dshrl-label'
    const CLASS_MENU = 'dshrl-menu'
    const CLASS_OPTION = 'dshrl-option'
    const CLASS_OPTION_ACTIVE = 'dshrl-optionActive'
    const CLASS_CHECK = 'dshrl-check'
    const CLASS_CAPTION = 'dshrl-caption'

    const LANGUAGES = [
      { id: 'en', short: 'EN', native: 'English', english: 'English' },
      { id: 'ru', short: 'RU', native: 'Русский', english: 'Russian' },
      { id: 'de', short: 'DE', native: 'Deutsch', english: 'German' },
      { id: 'fr', short: 'FR', native: 'Français', english: 'French' },
      { id: 'es', short: 'ES', native: 'Español', english: 'Spanish' },
      { id: 'it', short: 'IT', native: 'Italiano', english: 'Italian' },
      { id: 'pt', short: 'PT', native: 'Português', english: 'Portuguese' },
      { id: 'uk', short: 'UK', native: 'Українська', english: 'Ukrainian' },
      { id: 'tr', short: 'TR', native: 'Türkçe', english: 'Turkish' },
      { id: 'pl', short: 'PL', native: 'Polski', english: 'Polish' },
      { id: 'nl', short: 'NL', native: 'Nederlands', english: 'Dutch' },
      { id: 'zh-hans', short: 'ZH', native: '中文（简体）', english: 'Simplified Chinese' },
      { id: 'ja', short: 'JA', native: '日本語', english: 'Japanese' },
      { id: 'ko', short: 'KO', native: '한국어', english: 'Korean' },
      { id: 'hi', short: 'HI', native: 'हिन्दी', english: 'Hindi' },
      { id: 'ar', short: 'AR', native: 'العربية', english: 'Arabic' },
    ]

    const STYLES =
      '.' + CLASS_ROOT + '{position:relative;display:inline-flex;flex:none}' +
      '.' + CLASS_TRIGGER + '{border-radius:var(--dsw-radius-sm,var(--dsw-radius,6px));height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;outline:none;align-items:center;gap:4px;padding:0 6px 0 8px;font-size:13px;font-weight:400;line-height:20px;display:inline-flex;font-family:inherit}' +
      '@media (hover:hover){.' + CLASS_TRIGGER + ':hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}' +
      '.' + CLASS_TRIGGER + ':focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}' +
      '.' + CLASS_TRIGGER + ':disabled{color:var(--dsw-alias-label-dimmed);cursor:default}' +
      '.' + CLASS_TRIGGER_ACTIVE + '{background:var(--dsw-alias-interactive-bg-hover)}' +
      '.' + CLASS_LABEL + '{min-width:36px;text-align:center;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}' +
      '.' + CLASS_MENU + '{box-sizing:border-box;z-index:1100;width:max-content;min-width:min(220px,calc(100vw - 32px));max-width:min(300px,calc(100vw - 32px));max-height:min(340px,calc(100vh - 96px));overflow:hidden auto;padding:4px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#fff));box-shadow:var(--dsw-elevation-prominent);border:1px solid var(--dsw-alias-border-l1,transparent);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;position:fixed}' +
      '.' + CLASS_OPTION + '{box-sizing:border-box;border-radius:var(--dsw-radius-md,8px);width:auto;min-width:100%;min-height:34px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;outline:none;align-items:center;gap:6px;padding:5px 7px;font-size:13px;line-height:18px;display:flex;font-family:inherit}' +
      '@media (hover:hover){.' + CLASS_OPTION + ':hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}' +
      '.' + CLASS_OPTION + ':focus-visible{background:var(--dsw-alias-interactive-bg-hover)}' +
      '.' + CLASS_OPTION_ACTIVE + '{background:var(--dsw-alias-interactive-bg-hover)}' +
      '.' + CLASS_CHECK + '{color:var(--dsw-alias-label-primary);flex:0 0 14px;place-items:center;display:grid}' +
      '.' + CLASS_CHECK + ' svg{width:14px;height:14px}' +
      '.' + CLASS_CAPTION + '{color:var(--dsw-alias-label-tertiary);margin-left:auto;padding-left:12px;white-space:nowrap;font-size:12px}'

    let stylesDone = false

    function ensureStyles() {
      if (stylesDone || typeof document === 'undefined' || !document.head) return
      if (document.querySelector('style[data-plugin-css="' + SOURCE_KIND + '"]')) {
        stylesDone = true
        return
      }
      const tag = document.createElement('style')
      tag.setAttribute('data-plugin-css', SOURCE_KIND)
      tag.textContent = STYLES
      document.head.appendChild(tag)
      stylesDone = true
    }

    function fetchConfig() {
      return fetch(CONFIG_PATH, { headers: { accept: 'application/json' } }).then((response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
    }

    function postConfig(language) {
      return fetch(CONFIG_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ language }),
      }).then((response) => {
        if (!response.ok) {
          return response.json().then(
            (body) => {
              throw new Error((body && body.error) || 'HTTP ' + response.status)
            },
            () => {
              throw new Error('HTTP ' + response.status)
            },
          )
        }
        return response.json()
      })
    }

    const GlobeIcon = React.memo(function GlobeIcon() {
      return React.createElement(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', style: { flex: 'none' } },
        React.createElement('circle', { cx: 8, cy: 8, r: 6.2, stroke: 'currentColor', strokeWidth: 1.3 }),
        React.createElement('path', {
          d: 'M2 8h12M8 1.9c1.7 1.7 2.6 3.8 2.6 6.1S9.7 12.4 8 14.1C6.3 12.4 5.4 10.3 5.4 8s.9-4.4 2.6-6.1z',
          stroke: 'currentColor',
          strokeWidth: 1.1,
        }),
      )
    })

    const CheckIcon = React.memo(function CheckIcon() {
      return React.createElement(
        'svg',
        { viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        React.createElement('path', {
          d: 'M3.5 8.5l3 3 6-7',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      )
    })

    function entryOf(id) {
      if (id === AUTO_ID) return { id: AUTO_ID, short: 'AUTO', native: 'Auto', english: 'Auto' }
      return LANGUAGES.find((entry) => entry.id === id) || null
    }

    const OPTION_LIST = [{ id: AUTO_ID, short: 'AUTO', native: 'Auto', english: 'Auto' }].concat(LANGUAGES)

    const VIEWPORT_MARGIN = 8
    const TRIGGER_GAP = 6

    function placeMenu(root, menu) {
      if (!root || !menu) return null
      const rect = root.getBoundingClientRect()
      const width = Math.min(menu.offsetWidth || 0, window.innerWidth - VIEWPORT_MARGIN * 2)
      const height = Math.min(menu.offsetHeight || 0, window.innerHeight - VIEWPORT_MARGIN * 2)
      const spaceAbove = rect.top - VIEWPORT_MARGIN - TRIGGER_GAP
      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN - TRIGGER_GAP
      const opensAbove = height <= spaceAbove || spaceAbove >= spaceBelow
      const rawTop = opensAbove ? rect.top - TRIGGER_GAP - height : rect.bottom + TRIGGER_GAP
      const top = Math.max(VIEWPORT_MARGIN, Math.min(rawTop, window.innerHeight - VIEWPORT_MARGIN - height))
      const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - VIEWPORT_MARGIN - Math.max(width, 1)))
      return { left, top, maxWidth: window.innerWidth - VIEWPORT_MARGIN * 2 }
    }

    function LanguagePill() {
      const rootRef = React.useRef(null)
      const menuRef = React.useRef(null)
      const [language, setLanguage] = React.useState(null)
      const [open, setOpen] = React.useState(false)
      const [error, setError] = React.useState('')
      const [position, setPosition] = React.useState(null)

      React.useEffect(() => {
        let alive = true
        fetchConfig()
          .then((body) => {
            if (alive && body && body.ok && body.config) setLanguage(body.config.language)
          })
          .catch(() => {
            if (alive) setError('host route unavailable')
          })
        return () => {
          alive = false
        }
      }, [])

      React.useLayoutEffect(() => {
        if (!open) {
          setPosition(null)
          return undefined
        }
        const placed = placeMenu(rootRef.current, menuRef.current)
        if (placed) setPosition(placed)
        return undefined
      }, [open])

      React.useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (event) => {
          const target = event.target
          if (rootRef.current && rootRef.current.contains(target)) return
          if (target instanceof Element && menuRef.current && menuRef.current.contains(target)) return
          setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        const onResize = () => setOpen(false)
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        window.addEventListener('resize', onResize)
        return () => {
          document.removeEventListener('mousedown', onPointerDown)
          document.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('resize', onResize)
        }
      }, [open])

      const select = (id) => {
        if (document.activeElement instanceof Element && menuRef.current && menuRef.current.contains(document.activeElement)) {
          document.activeElement.blur()
        }
        setOpen(false)
        if (id === language) return
        const previous = language
        setLanguage(id)
        setError('')
        postConfig(id)
          .then((body) => {
            if (body && body.ok && body.config) setLanguage(body.config.language)
          })
          .catch((err) => {
            setLanguage(previous)
            setError((err && err.message) || 'save failed')
          })
      }

      const entry = entryOf(language) || { short: '—', native: 'Loading', english: 'Loading' }
      const titleParts = ['Reply language: ' + entry.english]
      if (error) titleParts.push(error)
      if (language === null) titleParts.push('reading config')

      const menu = open
        ? ReactDOM.createPortal(
            React.createElement(
              'div',
              {
                ref: menuRef,
                className: CLASS_MENU,
                role: 'menu',
                'aria-label': 'Reply language',
                style: position
                  ? { left: position.left, top: position.top, maxWidth: position.maxWidth, visibility: 'visible' }
                  : { left: 0, top: 0, visibility: 'hidden' },
              },
              OPTION_LIST.map((option) =>
                React.createElement(
                  'button',
                  {
                    key: option.id,
                    type: 'button',
                    role: 'menuitemradio',
                    'aria-checked': option.id === language ? 'true' : 'false',
                    className: option.id === language ? CLASS_OPTION + ' ' + CLASS_OPTION_ACTIVE : CLASS_OPTION,
                    onClick: () => select(option.id),
                  },
                  React.createElement('span', { className: CLASS_CHECK }, option.id === language ? React.createElement(CheckIcon, null) : null),
                  React.createElement('span', null, option.native),
                  option.id === AUTO_ID ? React.createElement('span', { className: CLASS_CAPTION }, 'follow the conversation') : null,
                ),
              ),
            ),
            document.body,
          )
        : null

      return React.createElement(
        'span',
        { className: CLASS_ROOT, ref: rootRef },
        React.createElement(
          'button',
          {
            type: 'button',
            className: open ? CLASS_TRIGGER + ' ' + CLASS_TRIGGER_ACTIVE : CLASS_TRIGGER,
            title: titleParts.join(' — '),
            'aria-haspopup': 'menu',
            'aria-expanded': open ? 'true' : 'false',
            onClick: () => setOpen(!open),
          },
          React.createElement(GlobeIcon, null),
          React.createElement('span', { className: CLASS_LABEL }, entry.short),
        ),
        menu,
      )
    }

    const inject = ['slots']

    function apply(ctx) {
      try {
        ensureStyles()
        ctx.effect(
          () =>
            ctx.slots.inject('conversation.composer.bar', () =>
              ctx.slots.register(
                {
                  name: 'conversation.input.right',
                  id: 'reply-language',
                  order: 40,
                  registrant: 'dsh-reply-language',
                },
                LanguagePill,
              ),
            ),
          'dsh-reply-language: composer pill',
        )
      } catch (error) {
        console.error('[dsh-reply-language] client apply failed:', error)
      }
    }

    exports.apply = apply
    exports.inject = inject
    exports._placeMenu = placeMenu
    return module.exports
  },
})

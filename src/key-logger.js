;(function(){
/**
 +----------------------------------------------------------------------------------------------------------------------
 | Constants
 +----------------------------------------------------------------------------------------------------------------------
*/

const VERSION = 0.1;
const COLORS = {
    red: '#F44236',
    green: '#4BAF4F',
    blue: '#2095F2',
    orange: '#ff5722',
};


/**
 +----------------------------------------------------------------------------------------------------------------------
 | Initializers, helper methods
 +----------------------------------------------------------------------------------------------------------------------
*/


/**
 * @param {HTMLElement} element
 * @param {String} backgroundColor
 * @return {undefined}
 */
function styleButton (element, backgroundColor) {
    element.style.cssText = `
        background-color: ${backgroundColor};
        color: #fff;
        padding: 12px 16px;
        margin: 0;
        border: 0;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        height: 45px;
    `;
}


/**
 * @desc Saves the passed-in event to state
 * @param {Event} event
 */
function logKeyEvent(event) {
    kl.state.captures.push([
        event.key,
        performance.now()
    ])
}


/**
 * @param {HTMLButtonElement} element
 * @param {Boolean} enabled
 */
function toggleButton(element, enabled) {
    element.disabled = enabled ? null : 'disabled';
    element.style.opacity = enabled ? 1 : 0.3;
    element.style.pointerEvents = enabled ? null : 'none';
}


/**
 * @param {String} text
 * @param {String} color
 */
function pprint(text, color) {
    console.info(
        `%cKeyLogger%c: %c${text}`,
        `color: #474747; border-bottom: 1px solid #474747`,
        '',
        `font-weight: bold; color: ${color}; font-size: 16px;`
    );
}


function convertToHex(str) {
    let hex = '';
    for(let i = 0; i < str.length; i++)
        hex += ''+str.charCodeAt(i).toString(16);

    return hex;
}

/**
 * @param {String|null} text
 * @param {String} [color]
 */
function showResponse(text, color) {
    kl.els.statusOverlay.innerHTML = '';

    if (!text) return;
    const n = document.createElement('div');
    n.textContent = text;
    n.style.cssText = `
        padding: 8px 16px;
        background-color: ${color};
        color: white;
    `;
    kl.els.statusOverlay.appendChild(n);
}


/** @param {String} session_id */
function checkSubmit(session_id) {
    let img = new Image();
    img.onload = function() {
        kl.fn.init(null);
        showResponse('Data successfully saved', COLORS.green);
        img = null; // Dispose of the image

        window.setTimeout(function() { showResponse(null) }, 1500);
    };
    img.onerror = function() {
        showResponse('Data submit failed! Try to submit again...', COLORS.red);
        img = null; // Dispose of the image
    };

    img.src = `${kl.backendUrl}/check_submit.gif?s=${session_id}`;
}


/**
 +----------------------------------------------------------------------------------------------------------------------
 | State
 +----------------------------------------------------------------------------------------------------------------------
*/

const kl = window.keyLogger = {
    /** Hold references to DOM nodes */
    els: {
        start: null,
        stop: null,
        reset: null,
        submit: null,
        toolbar: null,
        statusOverlay: null,
        rootNode: null,
    },

    /** Capture state that will be sent to backend */
    state: {
        captures: [],
        username: null,
        frontend_url: null,
        version: VERSION,
    },

    /** Internal flags */
    isRunning: false,
    isListening: false,
    didInit: false,
    backendUrl: null,

    /** Public API functions */
    fn: {},
};




/**
 +----------------------------------------------------------------------------------------------------------------------
 | Public methods
 +----------------------------------------------------------------------------------------------------------------------
*/

/**
 * @desc
 * - Initialize toolbar with controls
 * - Add event listener
 *
 * @param {String|null} username
 * @param {String} [backendUrl]
 */
kl.fn.init = function(username, backendUrl) {
    if (kl.didInit)
        pprint('Reset', COLORS.orange);

    if (!kl.state.username && !username) return alert('Username was not found!\nCheck your bookmarklet!');
    if (!kl.backendUrl && !backendUrl) return alert('Backend URL was not found!\nCheck your bookmarklet!');
    // no trailing slash
    if (backendUrl) kl.backendUrl = backendUrl.slice(-1) === '/' ? backendUrl.slice(0, -1) : backendUrl;

    const { state, els } = kl;

    state.frontend_url = window.location.href;
    if (username !== null) state.username = username || '-- undefined --';
    if (state.captures.length) state.captures = [];

    /**
     * Make sure that the root node is empty
     * and clear all references to nodes
     */
    if (els.rootNode) els.rootNode.innerHTML = '';
    Object.keys(els).forEach(k => els[k] = null);
    els.rootNode = document.createElement('div');


    /** Create and style buttons */
    els.start = document.createElement('button');
    styleButton(els.start, COLORS.green);
    els.start.textContent = '\u25B6';
    els.start.onclick = kl.fn.start;

    els.stop = document.createElement('button');
    styleButton(els.stop, COLORS.red);
    els.stop.textContent = '\u2B1B';
    els.stop.onclick = kl.fn.stop;
    toggleButton(els.stop, false);

    els.reset = document.createElement('button');
    styleButton(els.reset, COLORS.orange);
    els.reset.textContent = 'Reset';
    els.reset.onclick = function() { kl.fn.init(null) };

    els.submit = document.createElement('button');
    styleButton(els.submit, COLORS.blue);
    els.submit.textContent = 'Submit';
    els.submit.onclick = kl.fn.submit;
    toggleButton(els.submit, false);


    /** Submit status notifier */
    kl.els.statusOverlay = document.createElement('div');
    kl.els.statusOverlay.style.cssText = `
        position: fixed;
        top: 0; bottom: 0; 
        left: 0; right: 0;
        z-index: 999;
        
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        pointer-events: none;
    `;
    els.rootNode.appendChild(kl.els.statusOverlay);


    /** Add buttons to toolbar and apend it to document body */
    els.toolbar = document.createElement('div');
    els.toolbar.style.cssText = `
        position: fixed; 
        bottom: 8px; right: 8px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    `;
    [els.start, els.stop, els.reset, els.submit].forEach(e => els.toolbar.appendChild(e));
    els.rootNode.appendChild(els.toolbar);


    /** Add the root node to document.body */
    document.body.appendChild(els.rootNode);


    /** Add the keyboard event logger */
    if (!kl.isListening) {
        document.body.tabIndex = '-1';
        document.body.addEventListener('keydown', function(event) {
            if (kl.isRunning) logKeyEvent(event);
        }, true);
        kl.isListening = true;
    }

    kl.fn.start();
};


/** @desc Start the meassuring */
kl.fn.start = function() {
    pprint('Start', COLORS.green);
    kl.isRunning = true;
    toggleButton(kl.els.start, false);
    toggleButton(kl.els.stop, true);
    toggleButton(kl.els.submit, true);
};


/** @desc Stop the meassuring */
kl.fn.stop = function() {
    pprint('Stop', COLORS.red);
    kl.isRunning = false;
    toggleButton(kl.els.stop, false);
    toggleButton(kl.els.start, true);
};


/** @desc Submit data to backend */
kl.fn.submit = function() {
    showResponse(null);
    pprint('Submit', COLORS.blue);
    const session = convertToHex(kl.state.username + Math.floor((new Date() * 1) + performance.now()));

    /**
     * Send the data by 'no-cors' request and check how it went
     *
     * 'no-cors' request returns opaque response which does not tell
     * the result status (or data), so we'll use image request
     * to check that the just-saved data has been received
     */
    const data = Object.assign({}, kl.state, { session });
    const config = {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };
    fetch(`${kl.backendUrl}/submit/`, config).then(() => checkSubmit(session));

    console.info(session, data);
};

})();

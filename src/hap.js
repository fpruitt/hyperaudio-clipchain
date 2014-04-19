
var HAP = {};

HAP.init = (function (window, document) {

    var player;
    var projector;
    var music;
    var stage;
    var transcript;

    var sidemenu;

    var mixTitleForm;
    var mixTitle;
    var mixTitleHandler;
    var saveButton;
    var clearButton;
    var searchButton;
    var savingAnim;

    var fade;
    var trim;
    var title;
    var clear;
    var search;

    var defaultTranscriptId = null; //'XMVjtXOUSC-V0sSZBOKrBw';

    var transcriptId = HA.getURLParameter('t');
    var mixId = HA.getURLParameter('m');

    function loaded() {

        // Init the API utility
        HA.api.init();
        
        player = HA.Player({
            target: "#video-source",
            gui: true
        });

        music = HA.Music({
            target: "#music-player"
        });

        projector = HA.Projector({
            target: "#stage-videos",
            music: music
        });

        stage = HA.Stage({
            target: "#stage",
            projector: projector
        });

        transcript = HA.Transcript({
            target: "#transcript",
            stage: stage,
            player: player
        });

        mixTitleForm = document.getElementById('mix-title-form');
        mixTitle = document.getElementById('mix-title');
        saveButton = document.getElementById('save-button');
        //clearButton = document.getElementByID('transcript-options');
        //searchButton = document.getElementByID('transcript-options');
        savingAnim = document.querySelector('#save-button-saving');

        function mediaSelect(el) {
            var id = el.getAttribute('data-id');
            sidemenu.close();
            transcript.load(id);
        }


        // Init the side menu
        sidemenu = new HA.SideMenu({
            el: '#sidemenu',
            stage: stage,
            callback: mediaSelect
        });

        // Title handler
        mixTitleHandler = function (e) {
            e.preventDefault();
            stage.mixDetails({
                title: mixTitle.value
            });
            if (typeof mixTitle.blur === 'function') {
                mixTitle.blur();
            }
        };

        // Title
        mixTitleForm.addEventListener('submit', mixTitleHandler, false);
        mixTitleForm.addEventListener('change', mixTitleHandler, false);
        mixTitle.addEventListener('keyup', function (e) {
            stage.mixDetails({
                title: this.value
            });
        }, false);

        stage.target.addEventListener(HA.event.load, function (e) {
            mixTitle.value = HA.api.mix.label;
            notify('load'); // Tell top frame the mix was loaded
        }, false);
        stage.target.addEventListener(HA.event.save, function (e) {
            savingAnim.style.display = 'none';
            notify('save'); // Tell top frame the mix was saved
        }, false);

        // Save button
        saveButton._tap = new HA.Tap({ el: saveButton });
        saveButton.addEventListener('tap', function () {
            savingAnim.style.display = 'block';
            stage.save();
        }, false);

        // Prompt login if attempting to save
        var signin = document.querySelector('#signin-modal');

        signin.querySelector('.modal-close').addEventListener('click', function (e) {
            e.preventDefault();
            signin.style.display = 'none';
        });

        signin.querySelector('#signin-form').addEventListener('submit', function (e) {
            e.preventDefault();
            signin.style.display = 'none';
            savingAnim.style.display = 'block';
            HA.api.signin({
                username: signin.querySelector('#username').value,
                password: signin.querySelector('#password').value
            }, function (success) {
                if (success) {
                    // try and save again
                    notify('login'); // Tell top frame the user has logged in.
                    stage.save();
                } else {
                    // Show the prompt again
                    signin.style.display = 'block';
                    savingAnim.style.display = 'none';
                }
            });
        });

        stage.target.addEventListener(HA.event.unauthenticated, function (e) {
            // Prompt login
            signin.style.display = 'block';
            // Hide saving anim
            savingAnim.style.display = 'none';
            notify('unauthenticated'); // Tell top frame the user is not logged in.
        });

        stage.target.addEventListener(HA.event.change, function (e) {
            notify('change'); // Tell top frame the mix (may have) changed
        });

        // Init special fx

        clearButton._tap = new HA.Tap({ el: '#clearFX' });
        clearButton.addEventListener('tap', function () {
            var id = el.getAttribute();
            transcriptId = null;
        }, false);


        //I know this is bad, but until I figure out where this should go...
        //Search code goes here!
        searchButton._tap = new HA.Tap({ el: '#searchFX' });
        searchButton.addEventListener('tap', function () {
            var form = document.getElementById(videoSelect);
            var transcriptsToGet = new Array();
            for (var i = 0; i < form.length; i++) {
                if (form.elements[i].type == 'checkbox' && form.element[i].checked == true) {
                    transcriptsToGet.push(form.elements[i].value);
                    console.log(form.elements[i].value);
                }
            }

        });

        fade = new HA.DragDrop({
            handle: '#fadeFX',
            dropArea: stage.target,
            draggableClass: 'draggableEffect',
            onDragStart: function (e) {
                HA.addClass(stage.target, 'dragdrop');
            },
            onDrop: function (el) {
                HA.removeClass(stage.target, 'dragdrop');
                if (!el) {
                    return;
                }
                el.setAttribute('data-effect', 'fade');
                el.className += ' effect';
                el.innerHTML = '<form onsubmit="return false"><label>Fade Effect: <span class="value">1</span>s</label><input id="effect-duration" type="range" value="1" min="0.5" max="5" step="0.1" onchange="this.setAttribute(\'value\', this.value); this.previousSibling.querySelector(\'span\').innerHTML = this.value;"></form>';
                stage.dropped(el, 'Fade');
            }
        });

        trim = new HA.DragDrop({
            handle: '#trimFX',
            dropArea: stage.target,
            draggableClass: 'draggableEffect',
            onDragStart: function (e) {
                HA.addClass(stage.target, 'dragdrop');
            },
            onDrop: function (el) {
                HA.removeClass(stage.target, 'dragdrop');
                if (!el) {
                    return;
                }
                el.setAttribute('data-effect', 'trim');
                el.className += ' effect';
                el.innerHTML = '<form onsubmit="return false"><label>Trim: <span class="value">1</span>s</label><input id="effect-duration" type="range" value="1" min="0" max="5" step="0.1" onchange="this.setAttribute(\'value\', this.value); this.previousSibling.querySelector(\'span\').innerHTML = this.value;"></form>';
                stage.dropped(el, 'Trim');
            }
        });

        title = new HA.DragDrop({
            handle: '#titleFX',
            dropArea: stage.target,
            draggableClass: 'draggableEffect',
            onDragStart: function (e) {
                HA.addClass(stage.target, 'dragdrop');
            },
            onDrop: function (el) {
                HA.removeClass(stage.target, 'dragdrop');
                if (!el) {
                    return;
                }
                el.setAttribute('data-effect', 'title');
                el.className += ' effect';
                var html = '<form onsubmit="return false">' +
					'<label>Title: <span class="value">1</span>s</label>' +
					'<div class="effect-checkboxes"><label for="effect-fullscreen">Full Screen:</label> <input type="checkbox" id="effect-fullscreen" checked onchange="if(this.checked) { this.setAttribute(\'checked\', true); } else { this.removeAttribute(\'checked\'); }"></div>' +
					'<input id="effect-title" type="text" value="Title" onchange="this.setAttribute(\'value\', this.value);" onkeyup="this.setAttribute(\'value\', this.value);">' +
					'<input id="effect-duration" type="range" value="1" min="0.5" max="5" step="0.1" onchange="this.setAttribute(\'value\', this.value); this.parentNode.querySelector(\'span\').innerHTML = this.value;">' +
					'</form>';

                // el.innerHTML = '<form onsubmit="return false"><label>Title: <span class="value">1</span>s</label><input id="effect-title" type="text" value="Title" onchange="this.setAttribute(\'value\', this.value);"><input id="effect-duration" type="range" value="1" min="0.5" max="5" step="0.1" onchange="this.setAttribute(\'value\', this.value); this.parentNode.querySelector(\'span\').innerHTML = this.value;"></form>';
                el.innerHTML = html;
                stage.dropped(el, 'Title');
            }
        });

        if (transcriptId) {
            transcript.load(transcriptId);
        } else {
            transcript.load(defaultTranscriptId);
        }

        if (mixId) {
            stage.load(mixId);
        }
    }

    function notify(type) {
        var topFrame = window.top;
        if (typeof topFrame.notify === 'function') {
            topFrame.notify(type);
        }
    }

    // kickstart
    function init() {
        // nothing to do
    }

    // Not sure if this findDraggable() function is ever called.
    function findDraggable(el) {
        return (/(^|\s)item($|\s)/).test(el.className) ? el : false;
    }

    window.addEventListener('load', loaded, false);
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

    return init;

})(window, document);

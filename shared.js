// ⚠️ REMPLACEZ CETTE URL par votre propre Google Apps Script URL
const SHEET_URL = 'VOTRE_GOOGLE_APPS_SCRIPT_URL_ICI';

const confettiColors = ['#6dbf9e','#f0c040','#d46895','#6899cc','#a8d8c0','#f5edd6','#b8895a'];

// ── FIX 3 : Session management ──────────────────────────────
// sessionStorage est effacé quand l'onglet se ferme.
// On efface les réponses seulement quand l'utilisateur arrive FRAÎCHEMENT sur page1.
function initSession() {
    const isPage1 = window.location.pathname.includes('page1');
    const hasActiveSession = sessionStorage.getItem('gp_session_active');
    if (isPage1 && !hasActiveSession) {
        localStorage.removeItem('gp_responses');
        localStorage.removeItem('gp_coins');
        localStorage.removeItem('gp_row_id');
        sessionStorage.setItem('gp_session_active', 'true');
    }
}

// ── FIX 4 : Row ID unique par session ───────────────────────
// Toutes les validations envoient ce même row_id →
// le script Google met à jour la même ligne au lieu d'en créer une nouvelle.
function getOrCreateRowId() {
    let rowId = localStorage.getItem('gp_row_id');
    if (!rowId) {
        rowId = 'gp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('gp_row_id', rowId);
    }
    return rowId;
}

// ── Confetti ──────────────────────────────────────────────
function launchConfetti() {
    const c = document.getElementById('confetti');
    c.innerHTML = '';
    for (let i = 0; i < 80; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        const size = (6 + Math.random() * 9) + 'px';
        p.style.width = size; p.style.height = size;
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        p.style.border = '1.5px solid rgba(92,61,32,0.25)';
        p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        p.style.animationDelay = (Math.random() * 0.8) + 's';
        c.appendChild(p);
    }
}

// ── Ripple ────────────────────────────────────────────────
function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.cssText = 'width:'+size+'px;height:'+size+'px;'
        +'left:'+(e.clientX - rect.left - size/2)+'px;'
        +'top:'+(e.clientY - rect.top - size/2)+'px';
    btn.appendChild(r);
    setTimeout(function() { r.remove(); }, 600);
}

// ── FIX 2 : Star rating — JS uniquement, sans CSS conflictuel ──
function initStarRatings() {
    document.querySelectorAll('.rating-stars').forEach(function(group) {
        var labels = Array.from(group.querySelectorAll('.star-label'));
        var inputs = Array.from(group.querySelectorAll('input[type="radio"]'));

        function setLit(upToIdx) {
            labels.forEach(function(l, i) {
                l.classList.toggle('lit', i <= upToIdx);
                l.classList.remove('hovered');
            });
        }

        function restoreFromChecked() {
            var checked = group.querySelector('input[type="radio"]:checked');
            if (checked) {
                setLit(parseInt(checked.value) - 1);
            } else {
                labels.forEach(function(l) {
                    l.classList.remove('lit', 'hovered');
                });
            }
        }

        labels.forEach(function(label, idx) {
            // Hover desktop
            label.addEventListener('mouseenter', function() {
                labels.forEach(function(l, i) {
                    l.classList.remove('lit');
                    l.classList.toggle('hovered', i <= idx);
                });
            });
            label.addEventListener('mouseleave', restoreFromChecked);

            // Click (desktop)
            label.addEventListener('click', function() {
                if (inputs[idx]) {
                    inputs[idx].checked = true;
                }
                setLit(idx);
            });

            // Touch (mobile) — empêcher le double-fire click+touch
            label.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (inputs[idx]) {
                    inputs[idx].checked = true;
                }
                setLit(idx);
            });
        });

        // Affichage initial si une valeur est déjà cochée
        restoreFromChecked();
    });
}

function updateStarDisplay(group) {
    var labels = Array.from(group.querySelectorAll('.star-label'));
    var checked = group.querySelector('input[type="radio"]:checked');
    var val = checked ? parseInt(checked.value) - 1 : -1;
    labels.forEach(function(l, i) {
        l.classList.toggle('lit', i <= val);
        l.classList.remove('hovered');
    });
}

// ── Collecte toutes les réponses de la page courante ──────
function collecterReponses() {
    var data = JSON.parse(localStorage.getItem('gp_responses') || '{}');

    document.querySelectorAll('input[type="radio"]:checked').forEach(function(input) {
        if (input.name) data[input.name] = input.value;
    });

    var groupes = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(function(input) {
        if (input.name) {
            if (!groupes[input.name]) groupes[input.name] = [];
            if (input.checked) groupes[input.name].push(input.value);
        }
    });
    Object.keys(groupes).forEach(function(key) {
        data[key] = groupes[key].join(', ');
    });

    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(function(input) {
        if (input.name) data[input.name] = input.value;
    });

    localStorage.setItem('gp_responses', JSON.stringify(data));
    return data;
}

// ── Restaure les réponses sauvegardées au chargement ──────
function restaurerReponses() {
    var data = JSON.parse(localStorage.getItem('gp_responses') || '{}');

    Object.keys(data).forEach(function(name) {
        try {
            var radio = document.querySelector('input[type="radio"][name="'+name+'"][value="'+CSS.escape(data[name])+'"]');
            if (radio) { radio.checked = true; }
        } catch(e) {}

        if (typeof data[name] === 'string') {
            data[name].split(', ').forEach(function(val) {
                try {
                    var cb = document.querySelector('input[type="checkbox"][name="'+name+'"][value="'+CSS.escape(val)+'"]');
                    if (cb) cb.checked = true;
                } catch(e) {}
            });
        }

        var txt = document.querySelector(
            'input[type="text"][name="'+name+'"],' +
            'input[type="email"][name="'+name+'"],' +
            'textarea[name="'+name+'"]'
        );
        if (txt) txt.value = data[name];
    });

    // Refresh star displays after restore
    document.querySelectorAll('.rating-stars').forEach(function(group) {
        updateStarDisplay(group);
    });
}

// ── FIX 4 : Envoi vers Google Sheets avec row_id ──────────
function envoyerReponses(btn, xp, nextOverlay) {
    var data = collecterReponses();
    data['row_id']    = getOrCreateRowId();
    data['timestamp'] = new Date().toISOString();

    fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
    }).catch(function(err) { console.warn('Envoi:', err); });

    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Réponses envoyées !';
    terminerValidation(btn, xp, nextOverlay);
}

function terminerValidation(btn, xp, showOverlay) {
    var coins = parseInt(localStorage.getItem('gp_coins') || '0') + xp;
    localStorage.setItem('gp_coins', coins);
    launchConfetti();
    setTimeout(function() {
        if (showOverlay) {
            document.getElementById('thankyou-overlay').classList.add('show');
        }
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalLabel || '<i class="fa-solid fa-check"></i> Valider';
    }, 700);
}

// ── Show Confirm Overlay ──────────────────────────────────
function showConfirmOverlay(e) {
    addRipple(document.getElementById('validateBtn'), e);
    document.getElementById('confirm-overlay').classList.add('show');
}

// ── Confirm Validate ──────────────────────────────────────
var currentBtn = null;
function confirmValidate() {
    currentBtn = document.getElementById('validateBtn');
    currentBtn.dataset.originalLabel = currentBtn.innerHTML;
    currentBtn.disabled = true;
    currentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';
    closeConfirmOverlay();
    envoyerReponses(currentBtn, 50, true);
}

// ── Close Confirm Overlay ─────────────────────────────────
function closeConfirmOverlay() {
    var o = document.getElementById('confirm-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() {
        o.classList.remove('show');
        o.style.opacity = ''; o.style.transition = '';
    }, 380);
}

// ── Fermer overlay ────────────────────────────────────────
function closeOverlay() {
    var o = document.getElementById('thankyou-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() {
        o.classList.remove('show');
        o.style.opacity = ''; o.style.transition = '';
    }, 380);
}

// ── Quitter — reset complet ───────────────────────────────
function quitApp() {
    sessionStorage.removeItem('gp_session_active');
    localStorage.removeItem('gp_responses');
    localStorage.removeItem('gp_coins');
    localStorage.removeItem('gp_row_id');
    window.close();
    setTimeout(function() { window.location.href = 'about:blank'; }, 300);
}

// ── Suivant avec sauvegarde ───────────────────────────────
function saveAndNext(e, nextPage) {
    e.preventDefault();
    collecterReponses();
    var card = document.querySelector('.card');
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-30px)';
    setTimeout(function() { window.location.href = nextPage; }, 280);
}

// ── Champs conditionnels ──────────────────────────────────
function toggleConditional(id, show) {
    var field = document.getElementById(id);
    if (!field) return;
    var input = field.querySelector('input, textarea');
    if (show) { field.classList.add('visible'); }
    else { field.classList.remove('visible'); if (input) input.value = ''; }
}

function toggleField(fieldId, checkbox) {
    toggleConditional(fieldId, checkbox.checked);
}

// ── Init au chargement ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    initSession();
    restaurerReponses();
    initStarRatings();
});

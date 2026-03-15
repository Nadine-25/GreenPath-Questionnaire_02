const SHEET_URL = 'https://script.google.com/macros/s/AKfycbz69gwwtLz7Qq4WJCSbR-guMIz0HeABi-RS6uYWAUHZFN5Xq1Ic192-PtJ-6MgmPTii/exec';

const confettiColors = ['#6dbf9e','#f0c040','#d46895','#6899cc','#a8d8c0','#f5edd6','#b8895a'];

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
    r.style.cssText = `width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top  - size/2}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
}

// ── Star rating interactive behavior ─────────────────────
function initStarRatings() {
    document.querySelectorAll('.rating-stars').forEach(function(group) {
        const labels = group.querySelectorAll('.star-label');
        const inputs = group.querySelectorAll('input[type="radio"]');

        labels.forEach(function(label, idx) {
            label.addEventListener('mouseenter', function() {
                labels.forEach(function(l, i) {
                    l.style.color = i <= idx ? 'var(--coin-yellow)' : 'var(--cream-dark)';
                    l.style.transform = i === idx ? 'scale(1.2)' : i < idx ? 'scale(1.05)' : 'scale(1)';
                });
            });

            label.addEventListener('mouseleave', function() {
                updateStarDisplay(group);
            });

            label.addEventListener('click', function() {
                setTimeout(function() { updateStarDisplay(group); }, 10);
            });
        });

        inputs.forEach(function(input) {
            input.addEventListener('change', function() {
                updateStarDisplay(group);
            });
        });
    });
}

function updateStarDisplay(group) {
    const labels = group.querySelectorAll('.star-label');
    const checked = group.querySelector('input[type="radio"]:checked');
    const checkedVal = checked ? parseInt(checked.value) : 0;
    labels.forEach(function(l, i) {
        if (i < checkedVal) {
            l.style.color = 'var(--coin-yellow)';
            l.style.transform = 'scale(1)';
        } else {
            l.style.color = 'var(--cream-dark)';
            l.style.transform = 'scale(1)';
        }
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
            var escaped = CSS.escape(data[name]);
            var radio = document.querySelector('input[type="radio"][name="'+name+'"][value="'+escaped+'"]');
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        } catch(e) {}

        if (typeof data[name] === 'string') {
            data[name].split(', ').forEach(function(val) {
                try {
                    var cb = document.querySelector('input[type="checkbox"][name="'+name+'"][value="'+CSS.escape(val)+'"]');
                    if (cb) cb.checked = true;
                } catch(e) {}
            });
        }

        var txt = document.querySelector('input[type="text"][name="'+name+'"], input[type="email"][name="'+name+'"], textarea[name="'+name+'"]');
        if (txt) txt.value = data[name];
    });

    document.querySelectorAll('.rating-stars').forEach(function(group) {
        updateStarDisplay(group);
    });
}

// ── Envoi vers Google Sheets ──────────────────────────────
function envoyerReponses(btn, xp, nextOverlay) {
    var data = collecterReponses();

    // Ajouter timestamp
    data['timestamp'] = new Date().toISOString();
    data['page'] = window.location.pathname.split('/').pop();

    fetch(SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    }).catch(function(err) {
        console.warn('Envoi échoué (mode no-cors normal):', err);
    });

    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Réponses envoyées !';
    terminerValidation(btn, xp, nextOverlay);
}

function terminerValidation(btn, xp, showOverlay) {
    let coins = parseInt(localStorage.getItem('gp_coins') || '0') + xp;
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
let currentBtn = null;
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
    const o = document.getElementById('confirm-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() {
        o.classList.remove('show');
        o.style.opacity = ''; o.style.transition = '';
    }, 380);
}

// ── Fermer overlay ────────────────────────────────────────
function closeOverlay() {
    const o = document.getElementById('thankyou-overlay');
    o.style.transition = 'opacity 0.35s';
    o.style.opacity = '0';
    setTimeout(function() {
        o.classList.remove('show');
        o.style.opacity = ''; o.style.transition = '';
    }, 380);
}

// ── Quitter ───────────────────────────────────────────────
function quitApp() {
    window.close();
    setTimeout(function() { window.location.href = 'about:blank'; }, 300);
}

// ── Suivant avec sauvegarde ───────────────────────────────
function saveAndNext(e, nextPage) {
    e.preventDefault();
    collecterReponses();
    const card = document.querySelector('.card');
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-30px)';
    setTimeout(function() { window.location.href = nextPage; }, 280);
}

// ── Champs conditionnels ──────────────────────────────────
function toggleConditional(id, show) {
    const field = document.getElementById(id);
    if (!field) return;
    const input = field.querySelector('input, textarea');
    if (show) { field.classList.add('visible'); }
    else { field.classList.remove('visible'); if (input) input.value = ''; }
}

function toggleField(fieldId, checkbox) {
    toggleConditional(fieldId, checkbox.checked);
}

// ── Init au chargement ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    restaurerReponses();
    initStarRatings();
});

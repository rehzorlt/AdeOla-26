// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBpsPehC68iAO8Xv6a8NYCvWeTUYQc5564",
    authDomain: "adeola-wedding-3685d.firebaseapp.com",
    projectId: "adeola-wedding-3685d",
    storageBucket: "adeola-wedding-3685d.firebasestorage.app",
    messagingSenderId: "218767515088",
    appId: "1:218767515088:web:6aec31f94e0fd4d034edd5"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. PRELOADER
window.addEventListener("load", () => {
    const bar = document.getElementById("loader-bar");
    if(bar) {
        bar.style.width = "100%";
        setTimeout(() => {
            document.body.classList.add('loaded');
            document.body.classList.remove('loading');
            const heroContent = document.querySelector('.hero-content');
            if(heroContent) heroContent.classList.add('active');
        }, 1200);
    }
});

// 3. SCROLL REVEAL
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 4. NAV SCROLL
window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (window.scrollY > 50) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
});

// 5. SLIDESHOW
let slideIndex = 0;
showSlides();
function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    if(slides.length === 0) return;
    for (i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
    slideIndex++;
    if (slideIndex > slides.length) {slideIndex = 1}
    slides[slideIndex-1].style.display = "block";
    setTimeout(showSlides, 4000); 
}

// 6. WISHES FEED
let wishesData = [];
let currentWish = 0;
db.collection("wishes").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    wishesData = snapshot.docs.map(doc => doc.data());
    cycleWishes();
});

function cycleWishes() {
    const container = document.getElementById('wishes-feed-display');
    if (!container) return;
    if (wishesData.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted)">No notes yet. Be the first!</p>';
        return;
    }
    const w = wishesData[currentWish];
    container.innerHTML = `
        <div class="live-wish">
            <p class="wish-msg">"${w.msg}"</p>
            <p class="wish-author">— ${w.name}</p>
        </div>
    `;
    currentWish = (currentWish + 1) % wishesData.length;
    setTimeout(cycleWishes, 6000);
}

// 7. PAYSTACK
const paymentForm = document.getElementById('paymentForm');
if(paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById("pay-email").value; 
        const amount = document.getElementById("pay-amount").value;
        let handler = PaystackPop.setup({ 
            key: 'pk_test_d3c5240502157140b95349275005089222687103', 
            email: email, amount: amount * 100, currency: 'NGN', 
            onClose: function(){alert('Transaction cancelled');}, 
            callback: function(response){alert('Received! Thank you.');} 
        });
        handler.openIframe();
    });
}

// 8. RSVP LOGIC
const resTypeSelect = document.getElementById('resType');
const plusOneCheck = document.getElementById('plusOneCheck');

if(resTypeSelect) {
    resTypeSelect.addEventListener('change', function() {
        const type = this.value;
        const groupContainer = document.getElementById('group-names-box');
        const plusOneSelect = document.getElementById('plus-one-select');
        const plusOneName = document.getElementById('plus-one-name-box');

        if(type === 'group') {
            groupContainer.style.display = 'block';
            plusOneSelect.style.display = 'none';
            plusOneName.style.display = 'none';
        } else {
            groupContainer.style.display = 'none';
            plusOneSelect.style.display = 'block';
            plusOneCheck.value = 'no';
            plusOneName.style.display = 'none';
        }
    });
}

if(plusOneCheck) {
    plusOneCheck.addEventListener('change', function() {
        const val = this.value;
        document.getElementById('plus-one-name-box').style.display = val === 'yes' ? 'block' : 'none';
    });
}

const rsvpForm = document.getElementById('rsvpForm');
if(rsvpForm) {
    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const inviter = document.getElementById('inviter').value;
        const resType = document.getElementById('resType').value;
        const wishText = document.getElementById('optionalWish').value;

        // Count Logic
        let count = 1; let details = "Self";
        if(resType === 'group') {
            const gNames = document.getElementById('groupNames').value;
            if(gNames.split(',').length > 10) { alert("Max 10 guests for group."); return; }
            count = gNames.split(',').length; details = gNames;
        } else {
            if(document.getElementById('plusOneCheck').value === 'yes') {
                const pName = document.getElementById('plusOneName').value;
                if(!pName) { alert("Please enter Partner's Name"); return; }
                count = 2; details = "Plus One: " + pName;
            }
        }

        // Code Generation
        let codePrefix = "C"; 
        let cat = "VIP";
        let inviterText = "GUEST";

        if (inviter === 'couple') { 
            codePrefix = "A"; cat = "COUPLE'S GUEST"; inviterText = "The Couple";
        } 
        else if (inviter === 'bride_family') { 
            codePrefix = "B"; cat = "BRIDE'S FAMILY"; inviterText = "Bride's Family";
        }
        else if (inviter === 'groom_family') { 
            codePrefix = "G"; cat = "GROOM'S FAMILY"; inviterText = "Groom's Family";
        }

        let code = codePrefix + "-" + Math.floor(1000 + Math.random() * 9000);
        let alloc = resType === 'group' ? `Table ${Math.floor(Math.random()*20)+1}` : `Seat ${Math.floor(Math.random()*100)+1}`;

        // Save RSVP
        db.collection("rsvps").add({
            leadName: name, email: email, phone: phone, count: count, details: details, inviter: inviter, code: code, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            // Save Wish if exists
            if(wishText.trim() !== "") {
                db.collection("wishes").add({
                    name: name, msg: wishText, timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            // Generate Ticket
            const data = { name: name, count: count, code: code, alloc: alloc, inviter: inviterText, cat: cat };
            localStorage.setItem('adeolaTicket', JSON.stringify(data));
            window.location.href = 'ticket.html';
        }).catch((err) => { 
            console.error(err); alert("Connection Error. Please try again."); 
        });
    });
}
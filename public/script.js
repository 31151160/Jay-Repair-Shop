// Initialize Supabase Client (Ensure your Supabase URL and Anon Key are included below or at the top of this file)
// const supabaseClient = supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// -------------------------------------------------------------
// 1. SUPABASE REVIEWS MANAGEMENT
// -------------------------------------------------------------

// Fetch and display reviews from Supabase
async function loadReviewsFromDatabase() {
    const reviewContainer = document.getElementById('reviewsDisplayContainer');
    if (!reviewContainer) return;

    const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return;
    }

    reviewContainer.innerHTML = '';

    if (data.length === 0) {
        reviewContainer.innerHTML = '<p class="text-gray-500 italic">No reviews yet. Be the first to leave one!</p>';
        return;
    }

    data.forEach(review => {
        const stars = '⭐'.repeat(review.rating || 5);
        const reviewCard = `
            <div class="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-4">
                <div class="text-amber-400 mb-2">${stars}</div>
                <p class="italic text-gray-800 mb-4">"${review.comment}"</p>
                <h4 class="font-bold text-slate-900">${review.name}</h4>
                <p class="text-xs text-gray-500">${review.service || 'Customer'}</p>
            </div>
        `;
        reviewContainer.innerHTML += reviewCard;
    });
}

// Submit a new review to Supabase
async function handleReviewSubmission(event) {
    event.preventDefault();

    const nameInput = document.getElementById('reviewName');
    const ratingInput = document.getElementById('reviewRating');
    const serviceInput = document.getElementById('reviewService');
    const commentInput = document.getElementById('reviewComment');

    const newReview = {
        name: nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Anonymous',
        rating: ratingInput ? parseInt(ratingInput.value) : 5,
        service: serviceInput && serviceInput.value.trim() ? serviceInput.value.trim() : 'General Service',
        comment: commentInput ? commentInput.value.trim() : ''
    };

    const { error } = await supabaseClient
        .from('reviews')
        .insert([newReview]);

    if (error) {
        console.error('Error submitting review to Supabase:', error);
        alert('Could not submit review. Please try again.');
        return;
    }

    event.target.reset();
    alert('Thank you for your feedback!');
    loadReviewsFromDatabase();
}


// -------------------------------------------------------------
// 2. SERVER.JS INTEGRATION (GEMINI AI CHATBOT & IMAGE UPLOADS)
// -------------------------------------------------------------

// Send chat message to Express backend endpoint (/api/chat)
async function handleChatbotSubmission(event) {
    event.preventDefault();

    const chatInput = document.getElementById('chatInput');
    const chatDisplay = document.getElementById('chatDisplayContainer');
    if (!chatInput || !chatDisplay) return;

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Append user message to UI
    chatDisplay.innerHTML += `
        <div class="mb-3 text-right">
            <span class="inline-block bg-blue-600 text-white px-4 py-2 rounded-2xl text-sm">${userMessage}</span>
        </div>
    `;
    chatInput.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();

        // Append AI response to UI
        const replyText = data.reply || data.error || 'Sorry, something went wrong.';
        chatDisplay.innerHTML += `
            <div class="mb-3 text-left">
                <span class="inline-block bg-gray-100 text-slate-800 px-4 py-2 rounded-2xl text-sm">${replyText}</span>
            </div>
        `;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    } catch (error) {
        console.error('Error reaching AI backend:', error);
        chatDisplay.innerHTML += `
            <div class="mb-3 text-left">
                <span class="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-2xl text-sm">Unable to connect to assistant right now.</span>
            </div>
        `;
    }
}

// Upload device photo to Express backend endpoint (/upload)
async function handleImageUpload(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return null;

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            return data.imageUrl; // Returns Cloudinary image URL
        } else {
            console.error('Upload failed:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}


// -------------------------------------------------------------
// 3. EVENT LISTENERS SETUP
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch of reviews
    loadReviewsFromDatabase();

    // Review Form Listener
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }

    // Chatbot Form Listener
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatbotSubmission);
    }
});
import React, { useState, useEffect } from 'react';
import { X, Star, HeartCrack, Plus, Send, RefreshCw } from 'lucide-react';
import { VetClinic, ClinicReview, User } from '../types';

interface ReviewsModalProps {
  clinic: VetClinic;
  currentUser: User | null;
  onClose: () => void;
  onOpenAuth: (type: 'login' | 'signup') => void;
}

export default function ReviewsModal({
  clinic,
  currentUser,
  onClose,
  onOpenAuth,
}: ReviewsModalProps) {
  const [reviews, setReviews] = useState<ClinicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [petType, setPetType] = useState('Dog');
  const [reviewText, setReviewText] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/clinics/${clinic.id}/reviews`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        setReviews([]);
        return;
      }
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load clinic reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [clinic.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!reviewText) {
      alert('Please fill out your review text.');
      return;
    }

    setPublishing(true);
    try {
      const token = localStorage.getItem('vetfinder_token');
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/clinics/${clinic.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userName: currentUser.name,
          userEmail: currentUser.email,
          petType,
          rating,
          reviewText,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not publish review.');
      }

      // Clear form and refetch
      setReviewText('');
      setRating(5);
      await fetchReviews();
    } catch (err) {
      alert('Failed to publish clinic rating review.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-[#F4FBF3] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-green-100 flex flex-col h-[85vh]">
        
        {/* Modal Top Panel banner */}
        <div className="bg-gradient-to-r from-[#58B368] to-[#BFE7C4] px-6 py-4.5 flex items-center justify-between text-white flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-white/20 px-2 py-0.5 rounded-md">Feedback Station</span>
            <h3 className="font-display font-black text-lg md:text-xl mt-0.5">{clinic.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/10 hover:bg-black/25 rounded-xl text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body (split view in large screens: reviews listing vs submission form) */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left panel: list of past feedback reviews (7/12 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-green-100">
              <h4 className="font-display font-bold text-gray-800 text-sm">Patient Reviews ({reviews.length})</h4>
              <button
                onClick={fetchReviews}
                className="text-xs text-[#58B368] hover:underline flex items-center gap-1 font-semibold"
                title="Refresh feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>

            {loading ? (
              <div className="flex-grow flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-[#58B368] border-green-100" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-green-100/50 space-y-2 flex-grow flex flex-col justify-center">
                <HeartCrack className="w-10 h-10 text-green-200 mx-auto" />
                <h5 className="font-bold text-gray-700">No Patient Reviews Yet</h5>
                <p className="text-xs text-gray-400">Be the very first pet parent to publish feedback about their experience!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white border border-green-100/30 rounded-2xl space-y-1.5 shadow-sm text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-800">{rev.userName}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex text-lime-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < rev.rating ? 'fill-lime-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 uppercase">
                        🐾 {rev.petType} parent
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      {rev.reviewText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: submit review form (5/12 cols) */}
          <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-green-100 md:pl-6 pt-6 md:pt-0 text-left">
            {!currentUser ? (
              <div className="bg-white p-5 rounded-2xl border border-green-100/50 text-center space-y-3">
                <h5 className="font-display font-bold text-gray-800 text-sm">Submit Clinical Audit</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Only registered pet parents can publish clinical feedback reviews. Login or create a fast profile in seconds to submit yours.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-2 border border-green-200 text-[#58B368] font-bold rounded-lg text-[11px]"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => onOpenAuth('signup')}
                    className="px-4 py-2 bg-[#58B368] text-white font-bold rounded-lg text-[11px]"
                  >
                    Register
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3.5 bg-white p-5 rounded-2xl border border-green-100/40">
                <h5 className="font-display font-black text-gray-800 text-sm pb-1.5 border-b border-green-50">Write Your Feedback</h5>

                {/* Rating select slider */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Rating Score</label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className="p-1 focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            i < rating ? 'fill-lime-400 text-lime-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-black text-gray-600 pl-1.5">{rating} / 5</span>
                  </div>
                </div>

                {/* Pet Class */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Pet Type</label>
                  <select
                    value={petType}
                    onChange={(e) => setPetType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-[38px]"
                  >
                    <option value="Dog">🐶 Dog Parent</option>
                    <option value="Cat">🐱 Cat Parent</option>
                    <option value="Bird">🦜 Bird Advocate</option>
                    <option value="Rabbit">🐰 Rabbit Parent</option>
                    <option value="Exotics">🦎 Exotic Pet Parent</option>
                  </select>
                </div>

                {/* Review comments */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Treatment Comments</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell your local community about the wait times, vet bedside manner, diagnostics, and care of this clinic..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={publishing}
                  className="w-full py-2.5 bg-[#58B368] hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Publishing Review...' : 'Send Review Rating'}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}


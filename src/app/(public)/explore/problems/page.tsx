"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Problem, ProblemStatus } from "@/types/problem";
import { ProblemCard } from "@/features/problems/components/ProblemCard";
import { DOMAINS } from "@/lib/constants/taxonomy";
import { Button } from "@/components/ui/Button";
import { Search, Filter, Loader2, X } from "lucide-react";

export default function ExploreProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  const fetchProblems = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "problems"),
        where("status", "==", ProblemStatus.PUBLISHED),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      if (selectedDomain) {
        q = query(
          collection(db, "problems"),
          where("status", "==", ProblemStatus.PUBLISHED),
          where("domain", "==", selectedDomain),
          orderBy("createdAt", "desc"),
          limit(20)
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as Problem);
      setProblems(data);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Problem Repository</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Discover real-world challenges from industry, government, and academia. 
            Find problems that match your skills and make a measurable impact.
          </p>
        </div>

        {/* Search & Mobile Filter Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search challenges by title, skills, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
          <Button 
            className="md:hidden" 
            variant="outline" 
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Domain</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="domain" 
                        checked={selectedDomain === ""}
                        onChange={() => setSelectedDomain("")}
                        className="bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">All Domains</span>
                    </label>
                    {DOMAINS.map(domain => (
                      <label key={domain} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="domain"
                          checked={selectedDomain === domain}
                          onChange={() => setSelectedDomain(domain)}
                          className="bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-300">{domain}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Additional filters can be added here (Difficulty, Skills, SDGs) */}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p>Loading problems...</p>
              </div>
            ) : filteredProblems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProblems.map(problem => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No problems found</h3>
                <p className="text-slate-400">
                  Try adjusting your filters or search terms to find what you&apos;re looking for.
                </p>
                {(searchTerm || selectedDomain) && (
                  <Button 
                    variant="ghost" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDomain("");
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-950">
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
            <h3 className="font-semibold text-white flex items-center">
              <Filter className="h-4 w-4 mr-2" /> Filters
            </h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Domain</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mobile-domain" 
                    checked={selectedDomain === ""}
                    onChange={() => setSelectedDomain("")}
                    className="w-5 h-5 bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-base text-slate-300">All Domains</span>
                </label>
                {DOMAINS.map(domain => (
                  <label key={domain} className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mobile-domain"
                      checked={selectedDomain === domain}
                      onChange={() => setSelectedDomain(domain)}
                      className="w-5 h-5 bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-base text-slate-300">{domain}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <Button className="w-full" onClick={() => setShowFilters(false)}>
              Show Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

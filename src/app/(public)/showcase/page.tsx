export const metadata = {
  title: 'Innovation Showcase | SynergyBridge',
  description: 'View the best solutions and projects delivered by our student teams.',
}

const DEMO_PROJECTS = [
  {
    id: 1,
    title: "CropGuard AI",
    description: "AI-powered crop disease detection solution",
    domain: "Agriculture & AI",
    status: "Completed",
    impact: "Deployed to 20 local farms, reducing crop loss by 35%"
  },
  {
    id: 2,
    title: "Smart Adaptive Traffic Management",
    description: "Intelligent traffic signal optimization and emergency vehicle priority",
    domain: "Smart Cities",
    status: "Completed",
    impact: "Pilot completed with 22% reduction in intersection wait times"
  },
  {
    id: 3,
    title: "SurakshaPath",
    description: "Innovative road solution focused on safer and more sustainable transportation",
    domain: "Mobility & AI",
    status: "Completed",
    impact: "Prototype verified with a 40% improvement in hazard detection"
  }
];

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#9C7A4C]/10 rounded-full mb-8">
          <svg className="w-10 h-10 text-[#9C7A4C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-[#1C1C1E] mb-4">Innovation Showcase</h1>
        <p className="text-xl text-[#5B5F73] mb-12 max-w-2xl mx-auto">
          We are currently gathering the most impactful projects and solutions created by our 
          student teams. Check back soon to see how SynergyBridge is changing the world.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {DEMO_PROJECTS.map(project => (
            <div key={project.id} className="bg-white border border-[#5B5F73]/20 rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#9C7A4C]/10 text-[#9C7A4C] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {project.domain}
                </span>
                <span className="bg-[#56C02B]/10 text-[#56C02B] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1C1E] mb-2 leading-tight">{project.title}</h3>
              <p className="text-[#5B5F73] text-sm mb-6 flex-1">
                {project.description}
              </p>
              <div className="pt-4 border-t border-[#5B5F73]/10">
                <h4 className="text-[10px] font-bold text-[#5B5F73] uppercase tracking-wider mb-1">Key Impact</h4>
                <p className="text-[#1C1C1E] font-medium text-xs">{project.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

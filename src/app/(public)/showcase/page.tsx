export const metadata = {
  title: 'Innovation Showcase | SynergyBridge',
  description: 'View the best solutions and projects delivered by our student teams.',
}

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
        <p className="text-xl text-[#5B5F73] mb-8 max-w-2xl mx-auto">
          We are currently gathering the most impactful projects and solutions created by our 
          student teams. Check back soon to see how SynergyBridge is changing the world.
        </p>
        <div className="bg-[#EFEDE8] border border-[#5B5F73]/20 rounded-xl p-8 inline-block">
          <h2 className="text-lg font-medium text-[#1C1C1E] mb-2">Coming Soon</h2>
          <p className="text-sm text-[#5B5F73]">
            This feature is currently in development.
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'About | SynergyBridge',
  description: 'Learn about SynergyBridge, the platform connecting students with real-world problems.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-6">About SynergyBridge</h1>
          <p className="text-xl text-slate-300">
            SynergyBridge is an innovative ecosystem designed to connect students with real-world 
            challenges provided by industry, government, and academia.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-800 pb-2">Our Mission</h2>
            <p className="text-slate-400 leading-relaxed">
              Our mission is to bridge the gap between academic learning and real-world application. 
              By providing a structured platform for students to tackle genuine problems, we foster 
              innovation, improve employability, and create tangible value for society and enterprise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 border-b border-slate-800 pb-2">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-medium text-blue-400 mb-2">1. Post Problems</h3>
                <p className="text-sm text-slate-400">Industry and government partners post real-world challenges they need solved.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-medium text-blue-400 mb-2">2. Form Teams</h3>
                <p className="text-sm text-slate-400">Students form teams, apply for problems, and get matched with mentors.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-lg font-medium text-blue-400 mb-2">3. Deliver Solutions</h3>
                <p className="text-sm text-slate-400">Collaborate in our workspace, deliver the solution, and earn verifiable credentials.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

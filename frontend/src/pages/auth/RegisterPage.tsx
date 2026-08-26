export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8">
          <h1 className="text-2xl font-bold text-text mb-2">Join Comp</h1>
          <p className="text-muted mb-6">Create your account to get started</p>

          <form className="space-y-4">
            <div>
              <label className="block text-text text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-2">College</label>
              <input
                type="text"
                placeholder="Your College"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-text text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-surface rounded-lg font-medium hover:bg-primary/80 transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:text-accent transition">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

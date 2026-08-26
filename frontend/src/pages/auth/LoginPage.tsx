export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8">
          <h1 className="text-2xl font-bold text-text mb-2">Welcome Back</h1>
          <p className="text-muted mb-6">Sign in to your Comp account</p>

          <form className="space-y-4">
            <div>
              <label className="block text-text text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
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
              Sign In
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:text-accent transition">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

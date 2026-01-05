// Force dynamic rendering for the entire dashboard route group
// This is required because dashboard pages use React Query for data fetching
// which doesn't work well with static pre-rendering
export const dynamic = 'force-dynamic'

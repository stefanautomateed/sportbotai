/**
 * User Context Box Component
 * 
 * Displays analysis.userContext with user's pick, stake,
 * and AI comment on the pick (neutral, never advisory).
 */

'use client';

import { UserContext } from '@/types';

interface UserContextBoxProps {
  userContext: UserContext;
}

export default function UserContextBox({ userContext }: UserContextBoxProps) {
  const { userPick, userStake, pickComment } = userContext;

  // Don't render if no user context provided
  if (!userPick && userStake === 0) {
    return null;
  }

  return (
    <div className="bg-accent-cyan/5 rounded-xl border-2 border-accent-cyan/20 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">👤</span>
        Your Selection
      </h3>

      {/* User Pick and Stake */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {userPick && (
          <div className="p-4 bg-white rounded-lg border border-accent-cyan/20">
            <p className="text-xs text-gray-500 mb-1">Your Pick</p>
            <p className="text-xl font-bold text-accent-cyan">{userPick}</p>
          </div>
        )}
        
        {userStake > 0 && (
          <div className="p-4 bg-white rounded-lg border border-accent-cyan/20">
            <p className="text-xs text-gray-500 mb-1">Stake</p>
            <p className="text-xl font-bold text-accent-cyan">
              {userStake} <span className="text-sm font-normal text-gray-500">units</span>
            </p>
          </div>
        )}
      </div>

      {/* Pick Comment */}
      {pickComment && (
        <div className="p-4 bg-white rounded-lg border border-accent-cyan/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>💬</span>
            Analysis of Your Pick
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">
            {pickComment}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        This is a neutral analysis of your selection, not advice.
      </p>
    </div>
  );
}

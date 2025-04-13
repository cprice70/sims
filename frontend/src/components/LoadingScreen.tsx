import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className= "min-h-screen bg-white p-8 font-mono flex flex-col items-center justify-center" >
    <div className="text-black text-sm mb-4" > { message } </div>
      < div className = "flex space-x-2" >
        <div className="w-4 h-4 bg-black animate-pulse" > </div>
          < div className = "w-4 h-4 bg-black animate-pulse" style = {{ animationDelay: '0.2s' }
}> </div>
  < div className = "w-4 h-4 bg-black animate-pulse" style = {{ animationDelay: '0.4s' }}> </div>
    </div>
    </div>
  );
};

export default LoadingScreen;
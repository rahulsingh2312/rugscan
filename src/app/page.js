'use client'
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [tokenMint, setTokenMint] = useState("");
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nftData, setNftData] = useState(null);
  const [loadingNft, setLoadingNft] = useState(false);
  const [creatorTokensData, setCreatorTokensData] = useState({});

  const fetchTokenData = async () => {
    if (!tokenMint.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenMint}/report`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setTokenData(data);
      
      // Try to fetch NFT data after token data is received
      fetchNftData(tokenMint);
      
      // Fetch creator's other tokens NFT data
      if (data.creatorTokens && data.creatorTokens.length > 0) {
        fetchCreatorTokensData(data.creatorTokens);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch token data");
      setTokenData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTokenClick = (mint) => {
    setTokenMint(mint); // Update the state first
  };
  
  useEffect(() => {
    if (tokenMint) {
      fetchTokenData(); // Now fetch with the updated tokenMint
    }
  }, [tokenMint]);
  const fetchNftData = async (mint) => {
    setLoadingNft(true);
    try {
      const response = await fetch(`https://api.degencdn.com/v1/nfts/${mint}`);
      if (response.ok) {
        const data = await response.json();
        setNftData(data);
      }
    } catch (err) {
      console.log("NFT data not available");
    } finally {
      setLoadingNft(false);
    }
  };
  
  // Fetch NFT data for creator's tokens
  const fetchCreatorTokensData = async (tokens) => {
    const tempData = {};
    
    // Process in batches to avoid too many parallel requests
    const batchSize = 5;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (token) => {
        try {
          const response = await fetch(`https://api.degencdn.com/v1/nfts/${token.mint}`);
          if (response.ok) {
            const data = await response.json();
            tempData[token.mint] = data;
          }
        } catch (err) {
          console.log(`NFT data not available for ${token.mint}`);
        }
      }));
    }
    
    setCreatorTokensData(tempData);
  };

  // Format large numbers with K, M, B suffixes
  const formatNumber = (num) => {
    if (!num) return '0';
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else {
      return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
  };

  // Format percentage
  const formatPct = (pct) => {
    return pct ? `${pct.toFixed(2)}%` : '0%';
  };

  return (
    <div className="min-h-screen text-black bg-gray-50">
    {/* Header */}
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <div className="relative">
            <Image src="/rugscan.png" alt="RugCheck" width={62} height={62} className="transition-transform hover:scale-110 duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#c69957] rounded-full animate-pulse"></div>
          </div>
          <span className="ml-3 bg-gradient-to-r from-[#c69957] to-blue-600 bg-clip-text text-transparent">RugScan</span>
        </h1>
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full animate-pulse">scanning live!</div>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="max-w-3xl mx-auto bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
              placeholder="Enter Solana token mint address"
              className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#c69957] focus:border-[#c69957] text-gray-900 transition-colors duration-300"
            />
            <button
              onClick={fetchTokenData}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#c69957] to-blue-600 text-white font-medium rounded-lg hover:from-[#d8a968] hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-[#c69957] focus:ring-offset-2 transition-all duration-300 disabled:opacity-70 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </span>
              ) : "Analyze Token"}
            </button>
          </div>
          {error && (
            <div className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded border-l-4 border-red-500">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Token Results */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c69957]"></div>
        </div>
      )}

      {!loading && tokenData && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md border border-gray-100">
          {/* Token Header */}
          <div className="p-6 border-b relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#c69957] to-blue-600 opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex flex-col sm:flex-row items-center relative z-10">
              {/* Token Image - Try NFT data first, then fallback to tokenData */}
              <div className="mb-4 sm:mb-0 mr-0 sm:mr-4 rounded-full overflow-hidden bg-gray-100 h-16 w-16 flex items-center justify-center border-2 border-[#c69957] p-0.5 flex-shrink-0">
                {nftData?.imageUri ? (
                  <img
                    src={nftData.imageUri}
                    alt={nftData.name || tokenData.tokenMeta?.name || "Token logo"}
                    className="h-full w-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = tokenData.fileMeta?.image || "/api/placeholder/64/64";
                    }}
                  />
                ) : tokenData.fileMeta?.image ? (
                  <img
                    src={tokenData.fileMeta.image}
                    alt={tokenData.tokenMeta?.name || "Token logo"}
                    className="h-full w-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/64/64";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-[#c69957] to-blue-600 text-white font-bold text-xl">
                    {(tokenData.tokenMeta?.symbol || "?")[0]}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">
                  {nftData?.name || tokenData.tokenMeta?.name || "Unknown Token"}
                </h2>
                <div className="flex items-center mt-1 justify-center sm:justify-start">
                  <span className="text-gray-700 mr-2 font-medium">
                    {nftData?.symbol || tokenData.tokenMeta?.symbol || "???"}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(tokenData.mint)}>
                    {tokenData.mint.slice(0, 4)}...{tokenData.mint.slice(-4)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mt-4 sm:mt-0 sm:ml-auto gap-2 flex-wrap justify-center">
                {/* Buy Now Button */}
                <a 
                  href={`https://gmgn.ai/sol/token/KWeg5qLI_${tokenData.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#c69957] hover:bg-[#d8a968] text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Buy Now
                </a>
                
                {/* Risk Badge */}
                {tokenData.risks && tokenData.risks.length > 0 && (
                  <div>
                    <div className={`px-4 py-2 rounded-full text-white font-medium ${
                      tokenData.risks[0].level === "danger" 
                        ? "bg-red-500 animate-pulse" 
                        : tokenData.risks[0].level === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}>
                      {tokenData.risks[0].level === "danger" ? "High Risk" : 
                       tokenData.risks[0].level === "warning" ? "Medium Risk" : "Low Risk"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {/* Token Supply */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-[#c69957]">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Token Supply</h3>
              <p className="text-xl font-semibold">
                {formatNumber(tokenData.token?.supply / Math.pow(10, tokenData.token?.decimals || 0))}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Decimals: {tokenData.token?.decimals || nftData?.decimals || 0}
              </p>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-[#c69957]">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Current Price</h3>
              <p className="text-xl font-semibold">
                ${tokenData.price ? tokenData.price.toFixed(8) : "Unknown"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Total Liquidity: ${formatNumber(tokenData.totalMarketLiquidity)}
              </p>
            </div>

              {/* Holders */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-[#c69957]">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Holders</h3>
                <p className="text-xl font-semibold">
                  {formatNumber(tokenData.totalHolders || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  LP Providers: {formatNumber(tokenData.totalLPProviders || 0)}
                </p>
              </div>
            </div>

            {/* Risks Section */}
            {tokenData.risks && tokenData.risks.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  {tokenData.risks.map((risk, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg transition-all duration-300 transform hover:translate-x-1 ${
                        risk.level === "danger" ? "bg-red-50 border-l-4 border-red-500" : 
                        risk.level === "warning" ? "bg-yellow-50 border-l-4 border-yellow-500" :
                        "bg-green-50 border-l-4 border-green-500"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 ${
                         risk.level === "danger" ? "text-red-500" : 
                         risk.level === "warning" ? "text-yellow-500" :
                         "text-green-500"
                       }`}>
                         {risk.level === "danger" ? "⚠️" : 
                          risk.level === "warning" ? "⚠️" : "✅"}
                       </div>
                       <div>
                         <h4 className="font-medium text-gray-900">{risk.name}</h4>
                         <p className="text-sm text-gray-600">{risk.description}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* Top Holders */}
           <div className="p-6 border-t border-gray-200">
             <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
               <span>Top Holders</span>
               <span className="ml-2 px-2 py-0.5 bg-[#c69957] text-white text-xs rounded-full">Key Influencers</span>
             </h3>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Address
                     </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Amount
                     </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Percentage
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {tokenData.topHolders && tokenData.topHolders.map((holder, index) => (
                     <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                         <div className="flex items-center">
                           <span className={`font-medium text-white mr-2 w-6 h-6 rounded-full flex items-center justify-center ${index < 3 ? 'bg-[#c69957]' : 'bg-gray-400'}`}>
                             {index + 1}
                           </span>
                           <span className="truncate max-w-xs">{holder.address}</span>
                           <button 
                             onClick={() => navigator.clipboard.writeText(holder.address)}
                             className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                             </svg>
                           </button>
                         </div>
                         {tokenData.knownAccounts && tokenData.knownAccounts[holder.address] && (
                           <span className="ml-8 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             {tokenData.knownAccounts[holder.address].name}
                           </span>
                         )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {formatNumber(holder.uiAmount)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <div className="flex items-center">
                           <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                             <div 
                               className="bg-[#c69957] h-2 rounded-full" 
                               style={{ width: `${Math.min(100, holder.pct)}%` }}
                             ></div>
                           </div>
                           {formatPct(holder.pct)}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>

        {/* Creator History with NFT Data */}
{tokenData.creatorTokens && tokenData.creatorTokens.length > 0 && (
  <div className="p-6 border-t border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Creator's Other Tokens ({tokenData.creatorTokens.length})</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokenData.creatorTokens.slice(0, 6).map((token, index) => {
        // Use data from creatorTokensData if available or fallback options
        const tokenNftData = creatorTokensData[token.mint];
        const displayName = tokenNftData?.name || token.name || "Unknown Token";
        const displaySymbol = tokenNftData?.symbol || token.symbol || "";
        
        return (
          <div key={index} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-[#c69957] group">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#c69957] to-blue-500 mr-3 text-white font-bold overflow-hidden group-hover:scale-110 transition-transform duration-300">
                {tokenNftData?.imageUri ? (
                  <img 
                    src={tokenNftData.imageUri} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.className = "hidden";
                      e.target.parentElement.innerHTML = displaySymbol?.[0]?.toUpperCase() || "?";
                    }}
                  />
                ) : (
                  displaySymbol?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div>
                <div className="flex items-center">
                  <div className="text-sm font-medium truncate max-w-xs">
                    {displayName}
                  </div>
                  <div className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                    {displaySymbol}
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex items-center">
                  <span className="text-gray-400">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <button 
                onClick={() => handleTokenClick(token.mint)} 
                className="text-[#c69957] hover:text-[#d8a968] font-medium transition-colors"
              >
                Analyze
              </button>
              <a 
                href={`https://gmgn.ai/sol/token/KWeg5qLI_${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Buy
              </a>
            </div>
          </div>
        );
      })}
    </div>
    {tokenData.creatorTokens.length > 6 && (
      <div className="mt-4 text-center">
        <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-colors duration-300">
           {tokenData.creatorTokens.length - 6} more tokens
        </button>
      </div>
    )}
  </div>
)}

           {/* Market Activity */}
           <div className="p-6 border-t border-gray-200">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Market Activity</h3>
             <div className="bg-gray-50 rounded-lg p-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="text-center">
                   <div className="text-xs text-gray-500 mb-1">24h Volume</div>
                   <div className="text-lg font-semibold">${formatNumber(tokenData.volume24h || 0)}</div>
                   <div className={`text-xs ${(tokenData.volumeChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {(tokenData.volumeChange24h || 0) >= 0 ? '↑' : '↓'} {Math.abs(tokenData.volumeChange24h || 0).toFixed(2)}%
                   </div>
                 </div>
                 <div className="text-center">
                   <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                   <div className="text-lg font-semibold">${formatNumber(tokenData.marketCap || 0)}</div>
                   <div className="text-xs text-gray-400">Fully Diluted</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xs text-gray-500 mb-1">Price Change</div>
                   <div className={`text-lg font-semibold ${(tokenData.priceChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {(tokenData.priceChange24h || 0) >= 0 ? '+' : ''}{(tokenData.priceChange24h || 0).toFixed(2)}%
                   </div>
                   <div className="text-xs text-gray-400">Last 24h</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xs text-gray-500 mb-1">Transactions</div>
                   <div className="text-lg font-semibold">{formatNumber(tokenData.txCount24h || 0)}</div>
                   <div className="text-xs text-gray-400">Last 24h</div>
                 </div>
               </div>
             </div>
           </div>

           {/* Token Information */}
           <div className="p-6 border-t border-gray-200">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Token Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <div className="space-y-3">
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-500">Token Mint</span>
                     <span className="text-sm font-medium text-gray-800 flex items-center">
                       <span className="truncate max-w-xs">{tokenData.mint}</span>
                       <button 
                         onClick={() => navigator.clipboard.writeText(tokenData.mint)}
                         className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                       </button>
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-500">Creator</span>
                     <span className="text-sm font-medium text-gray-800 flex items-center">
                       <span className="truncate max-w-xs">{tokenData.creator || "Unknown"}</span>
                       {tokenData.creator && (
                         <button 
                           onClick={() => navigator.clipboard.writeText(tokenData.creator)}
                           className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                         </button>
                       )}
                     </span>
                   </div>
                   {/* <div className="flex justify-between">
                     <span className="text-sm text-gray-500">Created</span>
                     <span className="text-sm font-medium text-gray-800">
                       {tokenData.createdAt ? new Date(tokenData.createdAt).toLocaleString() : "Unknown"}
                     </span>
                   </div> */}
                 </div>
               </div>
               <div>
                 </div>
                 </div>
                 </div>
                 </div>
         )  }
         </main>
         </div>
           
      
       ) }
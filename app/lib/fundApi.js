'use client';

/**
 * 通用 script 加载器（JSONP 等场景）
 * @param {string} url
 * @returns {Promise<void>}
 */
export const loadScript = (url) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      resolve();
    };
    script.onerror = () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      reject(new Error('数据加载失败'));
    };
    document.body.appendChild(script);
  });
};

/**
 * 根据股票代码推断腾讯接口前缀
 * @param {string} code
 * @returns {'sh' | 'sz' | 'bj'}
 */
const getTencentPrefix = (code) => {
  if (code.startsWith('6') || code.startsWith('9')) return 'sh';
  if (code.startsWith('0') || code.startsWith('3')) return 'sz';
  if (code.startsWith('4') || code.startsWith('8')) return 'bj';
  return 'sz';
};

/**
 * 获取单只基金的实时估值及前十重仓（含重仓股当日涨跌幅）
 * 完全使用 JSONP / script 注入方式，无服务端依赖
 *
 * @param {string} code 基金代码
 * @returns {Promise<object>} 统一的基金数据结构
 */
export const fetchFundData = async (code) => {
  return new Promise((resolve, reject) => {
    const gzUrl = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;

    // 东方财富接口固定调用 jsonpgz，我们通过临时覆盖的方式挂钩
    const scriptGz = document.createElement('script');
    scriptGz.src = gzUrl;

    const originalJsonpgz = window.jsonpgz;
    window.jsonpgz = (json) => {
      // 回调触发后立刻恢复原有的 jsonpgz，避免互相干扰
      window.jsonpgz = originalJsonpgz;
      if (document.body.contains(scriptGz)) document.body.removeChild(scriptGz);

      if (!json || typeof json !== 'object') {
        reject(new Error('未获取到基金估值数据'));
        return;
      }

      const gszzlNum = Number(json.gszzl);
      const gzData = {
        code: json.fundcode,
        name: json.name,
        dwjz: json.dwjz,
        gsz: json.gsz,
        gztime: json.gztime,
        gszzl: Number.isFinite(gszzlNum) ? gszzlNum : json.gszzl,
      };

      // 获取前十重仓股票列表
      const holdingsUrl = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10&year=&month=&rt=${Date.now()}`;
      loadScript(holdingsUrl)
        .then(async () => {
          let holdings = [];
          const html = window.apidata?.content || '';
          const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
          for (const r of rows) {
            const cells = (r.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi) || []).map((td) =>
              td.replace(/<[^>]*>/g, '').trim()
            );
            const codeIdx = cells.findIndex((txt) => /^\d{6}$/.test(txt));
            const weightIdx = cells.findIndex((txt) => /\d+(?:\.\d+)?\s*%/.test(txt));
            if (codeIdx >= 0 && weightIdx >= 0) {
              holdings.push({
                code: cells[codeIdx],
                name: cells[codeIdx + 1] || '',
                weight: cells[weightIdx],
                change: null,
              });
            }
          }

          holdings = holdings.slice(0, 10);

          // 补充每只重仓股当日涨跌幅（腾讯行情）
          if (holdings.length) {
            try {
              const tencentCodes = holdings
                .map((h) => `s_${getTencentPrefix(h.code)}${h.code}`)
                .join(',');
              const quoteUrl = `https://qt.gtimg.cn/q=${tencentCodes}`;

              await new Promise((resQuote) => {
                const scriptQuote = document.createElement('script');
                scriptQuote.src = quoteUrl;
                scriptQuote.onload = () => {
                  holdings.forEach((h) => {
                    const varName = `v_s_${getTencentPrefix(h.code)}${h.code}`;
                    const dataStr = window[varName];
                    if (dataStr) {
                      const parts = dataStr.split('~');
                      // parts[5] 是涨跌幅
                      if (parts.length > 5) {
                        h.change = parseFloat(parts[5]);
                      }
                    }
                  });
                  if (document.body.contains(scriptQuote)) document.body.removeChild(scriptQuote);
                  resQuote();
                };
                scriptQuote.onerror = () => {
                  if (document.body.contains(scriptQuote)) document.body.removeChild(scriptQuote);
                  resQuote();
                };
                document.body.appendChild(scriptQuote);
              });
            } catch (e) {
              // 行情补充失败不影响主流程
              console.error('获取股票涨跌幅失败', e);
            }
          }

          resolve({ ...gzData, holdings });
        })
        .catch(() => resolve({ ...gzData, holdings: [] }));
    };

    scriptGz.onerror = () => {
      window.jsonpgz = originalJsonpgz;
      if (document.body.contains(scriptGz)) document.body.removeChild(scriptGz);
      reject(new Error('基金数据加载失败'));
    };

    document.body.appendChild(scriptGz);

    // 防御性清理，避免极端情况下 script 残留
    setTimeout(() => {
      if (document.body.contains(scriptGz)) document.body.removeChild(scriptGz);
    }, 5000);
  });
};

/**
 * 基金搜索（名称 / 代码），使用东财 JSONP 接口
 * 仅返回“公募基金”类型的数据
 *
 * @param {string} keyword
 * @returns {Promise<any[]>}
 */
export const searchFunds = async (keyword) => {
  const val = String(keyword || '').trim();
  if (!val) return [];

  const callbackName = `SuggestData_${Date.now()}`;
  const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(
    val
  )}&callback=${callbackName}&_=${Date.now()}`;

  try {
    const fundsOnly = await new Promise((resolve, reject) => {
      window[callbackName] = (data) => {
        let result = [];
        if (data && data.Datas) {
          result = data.Datas.filter(
            (d) =>
              d.CATEGORY === 700 ||
              d.CATEGORY === '700' ||
              d.CATEGORYDESC === '基金'
          );
        }
        delete window[callbackName];
        resolve(result);
      };

      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        if (document.body.contains(script)) document.body.removeChild(script);
      };
      script.onerror = () => {
        if (document.body.contains(script)) document.body.removeChild(script);
        delete window[callbackName];
        reject(new Error('搜索请求失败'));
      };
      document.body.appendChild(script);
    });

    return fundsOnly;
  } catch (e) {
    console.error('搜索失败', e);
    return [];
  }
};



export const landingMarkup = `
<div class="dz-page" id="top">
<div class="dz-nav" style="display:flex;align-items:center;justify-content:space-between;padding:18px 64px;position:relative;z-index:5">
  <a href="#top" class="dz-logo" style="display:block;color:inherit;text-decoration:none;cursor:pointer;display:flex;flex-direction:column;gap:2px">
    <div style="display:flex;align-items:center;gap:8px"><svg width="28" height="28" viewBox="0 0 30 30"><path d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z" fill="#E8375A"></path></svg><span style="font-size:22px;font-weight:800;letter-spacing:-0.5px">Date<span style="color:#E8375A">ZA</span></span></div>
    <span style="font-size:9px;font-weight:700;letter-spacing:1.8px;color:#9A8F98;padding-left:36px">NO DNA. JUST RSA. 🇿🇦</span>
  </a>
  <button type="button" id="dz-menu-btn" class="dz-menu-btn" aria-expanded="false" aria-controls="dz-nav-links" aria-label="Open menu"><span></span><span></span><span></span></button>
  <div id="dz-nav-links" class="dz-nav-links" style="display:flex;gap:28px;align-items:center;font-size:14px;font-weight:500;color:#5F5566">
    <a href="#discover" style="color:#1C1720;font-weight:600;border-bottom:2px solid #E8375A;padding-bottom:3px;text-decoration:none;cursor:pointer">Discover</a><a href="/how-it-works" style="color:inherit;text-decoration:none;cursor:pointer">How It Works</a><a href="/dating-safely" style="color:inherit;text-decoration:none;cursor:pointer">Safety</a><a href="/stories" style="color:inherit;text-decoration:none;cursor:pointer">Success Stories</a><a href="/lifestyle" style="color:inherit;text-decoration:none;cursor:pointer">SA Lifestyle</a>
    <a href="/sign-in" class="dz-nav-signin" style="color:#1C1720;font-weight:600;text-decoration:none;cursor:pointer">Sign In</a>
    <a href="/sign-up" class="dz-nav-join" style="background:#E8375A;color:#fff;padding:12px 26px;border-radius:999px;font-weight:700;box-shadow:0 10px 26px rgba(232,55,90,.32);text-decoration:none;cursor:pointer;display:inline-block">Join Free</a>
  </div>
  <div id="dz-nav-backdrop" class="dz-nav-backdrop"></div>
</div>

<div class="dz-hero" style="position:relative;padding:44px 64px 40px;overflow:visible">
  <div class="dz-hero-glow" style="position:absolute;top:-60px;right:-80px;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,rgba(232,55,90,.07),transparent 65%)"></div>
  <div class="dz-hero-grid" style="display:grid;grid-template-columns:minmax(480px,1fr) 760px;gap:20px;align-items:center">
    <div class="dz-hero-copy" style="display:flex;flex-direction:column;gap:26px;position:relative;z-index:2">
      <h1 class="dz-hero-title" style="margin:0;font-family:'Instrument Serif',serif;font-weight:400;font-size:92px;line-height:.98;letter-spacing:-2px">Meet someone<br>who <em style="color:#E8375A">chooses</em> you.</h1>
      <div class="dz-hero-subrow" style="display:flex;align-items:center;gap:14px">
        <span class="dz-hero-sub" style="font-family:'Instrument Serif',serif;font-style:italic;font-size:40px;color:#1C1720">Right here.</span>
        <svg width="46" height="40" viewBox="0 0 46 40" style="animation:dz-pulse 2.6s ease-in-out infinite"><path d="M23 36S6 26 6 15.2C6 8.8 11 4.5 16.2 4.5c2.5 0 4.7 1 5.8 2.6 1.1-1.6 3.3-2.6 5.8-2.6C33 4.5 38 8.8 38 15.2 38 26 23 36 23 36z" fill="none" stroke="#E8375A" stroke-width="2.5"></path></svg>
      </div>
      <p class="dz-hero-desc" style="margin:0;font-size:17.5px;line-height:1.65;color:#5F5566;max-width:400px;text-wrap:pretty">Real South Africans. RealMe verified. Smarter matches based on what actually matters to you.</p>
      <div class="dz-hero-ctas" style="display:flex;gap:14px;align-items:center">
        <a href="/sign-up" class="dz-btn-primary-lg" style="background:#1C1720;color:#fff;padding:18px 34px;border-radius:999px;font-size:15.5px;font-weight:700;text-decoration:none;cursor:pointer;display:inline-block">Start Matching →</a>
        <a href="/sign-up" class="dz-btn-waiting" style="background:#E8375A;color:#fff;padding:18px 34px;border-radius:999px;font-size:15.5px;font-weight:700;box-shadow:0 10px 26px rgba(232,55,90,.32);text-decoration:none;cursor:pointer;display:inline-block">Girls are waiting</a>
      </div>
    </div>
    <div class="dz-hero-visual-mobile"><img class="dz-img" src="/images/people/couple-hero-mobile.webp" alt="A couple smiling together at sunset" loading="eager"></div>
    <div class="dz-hero-visual-wrap"><div class="dz-hero-visual" style="position:relative;height:680px">
      <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:absolute;top:64px;left:36px;width:330px;height:470px;border-radius:26px;overflow:hidden;transform:rotate(-7deg);box-shadow:0 22px 55px rgba(28,23,32,.16)">
        <img class="dz-img" src="/images/people/sipho.webp" alt="Sipho, 28, Johannesburg" loading="eager">
        <div style="position:absolute;left:0;right:0;bottom:0;padding:60px 16px 14px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.75));color:#fff;pointer-events:none"><div style="font-size:16px;font-weight:700">Sipho, 28 <span style="color:#7BE0B4;font-size:12px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:11.5px;opacity:.9">Johannesburg · 91%</div></div>
      </a>
      <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:absolute;top:10px;left:200px;width:400px;height:600px;border-radius:30px;overflow:hidden;box-shadow:0 36px 90px rgba(28,23,32,.28);z-index:2">
        <img class="dz-img dz-flip-x" src="/images/people/maya.webp" alt="Maya, 27, Cape Town" loading="eager">
        <div style="position:absolute;top:16px;left:16px;background:#22A06B;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:999px;pointer-events:none">New here</div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:130px 22px 20px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.85));color:#fff;pointer-events:none;display:flex;flex-direction:column;gap:9px">
          <div style="display:flex;align-items:flex-end;justify-content:space-between">
            <div><div style="font-size:26px;font-weight:800">Maya, 27 <span style="color:#7BE0B4;font-size:16px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:13px;opacity:.9">Cape Town · 3 km away</div></div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
              <div style="position:relative;width:66px;height:66px;display:flex;align-items:center;justify-content:center"><svg width="66" height="66" viewBox="0 0 66 66" style="position:absolute"><circle cx="33" cy="33" r="29" fill="rgba(255,255,255,.16)"></circle><circle cx="33" cy="33" r="29" fill="none" stroke="#2FD08A" stroke-width="4.5" stroke-dasharray="167 183" stroke-linecap="round" transform="rotate(-90 33 33)"></circle></svg><span style="font-size:18px;font-weight:800">92%</span></div>
              <span style="font-size:10px;font-weight:600;color:#7BE0B4">Great match</span>
            </div>
          </div>
          <div style="font-size:13.5px;line-height:1.5;opacity:.92">Marketing manager who loves hikes, strong coffee and ocean dips.</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><span style="font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.2)">Travel</span><span style="font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.2)">Coffee</span><span style="font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.2)">Hiking</span><span style="font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.2)">Music</span></div>
          <div style="display:flex;justify-content:center;gap:18px;margin-top:8px">
            <span style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.95);color:#5F5566;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
            <span style="width:62px;height:62px;border-radius:50%;background:#E8375A;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(232,55,90,.55);animation:dz-pulse 2.6s ease-in-out infinite"><svg width="26" height="26" viewBox="0 0 30 30"><path d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z" fill="#fff"></path></svg></span>
            <span style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.95);color:#5F5566;display:flex;align-items:center;justify-content:center;font-size:16px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.5 6.1-.1 1-.5 2.4-1.4 3.7 1.7-.2 3.3-.9 4.5-1.8 1 .3 2.2.5 3.4.5 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/></svg></span>
          </div>
        </div>
      </a>
      <div style="position:absolute;top:96px;right:0;width:262px;background:#fff;border:1px solid #F0EAEE;border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(28,23,32,.14);z-index:3;animation:dz-float 5s ease-in-out infinite">
        <div style="font-size:14.5px;font-weight:700;margin-bottom:12px">Why you're a great match</div>
        <div style="display:flex;flex-direction:column;gap:9px;font-size:13px;font-weight:500;color:#4A414F">
          <span style="display:flex;gap:9px;align-items:center"><span style="width:19px;height:19px;border-radius:50%;background:#E7F7EF;color:#22A06B;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>Both want children</span>
          <span style="display:flex;gap:9px;align-items:center"><span style="width:19px;height:19px;border-radius:50%;background:#E7F7EF;color:#22A06B;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>Love travelling</span>
          <span style="display:flex;gap:9px;align-items:center"><span style="width:19px;height:19px;border-radius:50%;background:#E7F7EF;color:#22A06B;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>Active lifestyle</span>
          <span style="display:flex;gap:9px;align-items:center"><span style="width:19px;height:19px;border-radius:50%;background:#E7F7EF;color:#22A06B;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>Value honesty</span>
          <span style="display:flex;gap:9px;align-items:center"><span style="width:19px;height:19px;border-radius:50%;background:#E7F7EF;color:#22A06B;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>Good banter</span>
        </div>
        <div style="border-top:1px solid #F0EAEE;margin-top:14px;padding-top:12px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:12px;color:#7A6F80;font-weight:600">Compatibility</span><span style="font-size:20px;font-weight:800;color:#22A06B">92%</span></div>
      </div>
      <div style="position:absolute;bottom:96px;right:24px;background:#fff;border:1px solid #F0EAEE;border-radius:18px;padding:15px 19px;box-shadow:0 16px 44px rgba(28,23,32,.14);display:flex;gap:12px;align-items:center;z-index:3;animation:dz-float 5s ease-in-out .8s infinite">
        <span style="width:38px;height:38px;border-radius:12px;background:#22A06B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span>
        <div><div style="font-size:13px;font-weight:700">RealMe Verified</div><div style="font-size:11px;color:#7A6F80">Real person. Verified identity.</div></div>
      </div>
      <div style="position:absolute;bottom:14px;left:110px;background:#fff;border:1px solid #F0EAEE;border-radius:999px;padding:11px 18px;box-shadow:0 14px 36px rgba(28,23,32,.13);display:flex;gap:10px;align-items:center;z-index:3">
        <span style="width:26px;height:26px;border-radius:50%;background:#FFF0F3;color:#E8375A;display:flex;align-items:center;justify-content:center;font-size:12px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M12 21s-6.7-4.35-9.33-8.2C1.02 10.68 1.6 7.4 4.1 5.7 6.2 4.3 8.9 4.7 10.5 6.6L12 8.3l1.5-1.7c1.6-1.9 4.3-2.3 6.4-.9 2.5 1.7 3.08 5 1.43 7.1C18.7 16.65 12 21 12 21z"/></svg></span>
        <span style="font-size:12.5px;font-weight:600">Aisha liked you back — <b style="color:#E8375A">it's a match!</b></span>
      </div>
      <svg width="90" height="66" viewBox="0 0 90 66" style="position:absolute;top:8px;left:120px;z-index:3"><path d="M8 56 C 22 26, 44 18, 54 30 C 60 38, 52 46, 46 40 C 40 34, 52 20, 78 14" fill="none" stroke="#F5B62E" stroke-width="2.5" stroke-linecap="round"></path><path d="M72 10 l8 3 -6 6" fill="none" stroke="#F5B62E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    </div></div>
  </div>
</div>

<div class="dz-section dz-tonight" id="discover" style="padding:74px 64px 30px;position:relative">
  <div class="dz-section-head" style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:26px">
    <div><div style="font-size:11.5px;font-weight:800;letter-spacing:2px;color:#E8375A;margin-bottom:10px">TONIGHT, NEAR YOU</div><div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:46px;line-height:1.05">People you'd actually<br><em style="color:#E8375A">want to meet.</em></div></div>
    <a href="/sign-up" style="font-size:13.5px;font-weight:700;color:#E8375A;padding-bottom:8px;text-decoration:none;cursor:pointer">See more →</a>
  </div>
  <div class="dz-tonight-grid" style="display:grid;grid-template-columns:1.35fr 1fr 1fr 1.35fr;grid-auto-rows:170px;gap:16px">
    <a href="/sign-up" class="dz-tonight-card dz-tonight-card--tall" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;grid-row:span 2;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/aisha.webp" alt="Aisha, 27, Durban" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:50px 16px 14px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:17px;font-weight:700">Aisha, 27 <span style="font-size:12px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:12px;opacity:.88">Durban · foodie at heart</div></div><div style="position:absolute;top:12px;right:12px;background:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800;color:#22A06B;pointer-events:none">93%</div></a>
    <a href="/sign-up" class="dz-tonight-card" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/lerato.webp" alt="Lerato, 26, Pretoria" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:40px 14px 12px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:14.5px;font-weight:700">Lerato, 26 <span style="font-size:11px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:11px;opacity:.88">Pretoria · sunset runner</div></div><div style="position:absolute;top:10px;right:10px;background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;color:#22A06B;pointer-events:none">89%</div></a>
    <a href="/sign-up" class="dz-tonight-card dz-extra-3" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/daniel.webp" alt="Daniel, 30, Cape Town" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:40px 14px 12px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:14.5px;font-weight:700">Daniel, 30 <span style="font-size:11px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:11px;opacity:.88">Cape Town · surf mornings</div></div><div style="position:absolute;top:10px;right:10px;background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;color:#22A06B;pointer-events:none">87%</div></a>
    <a href="/sign-up" class="dz-tonight-card dz-tonight-card--tall dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;grid-row:span 2;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/tyla.webp" alt="Tyla, 25, Gqeberha" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:50px 16px 14px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:17px;font-weight:700">Tyla, 25 <span style="font-size:12px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:12px;opacity:.88">Gqeberha · beach walks</div></div><div style="position:absolute;top:12px;right:12px;background:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800;color:#22A06B;pointer-events:none">88%</div></a>
    <a href="/sign-up" class="dz-tonight-card dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/justin.webp" alt="Justin, 29, Stellenbosch" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:40px 14px 12px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:14.5px;font-weight:700">Justin, 29 <span style="font-size:11px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:11px;opacity:.88">Stellenbosch · wine routes</div></div><div style="position:absolute;top:10px;right:10px;background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;color:#22A06B;pointer-events:none">86%</div></a>
    <a href="/sign-up" class="dz-tonight-card dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(28,23,32,.1)"><img class="dz-img" src="/images/people/thandi.webp" alt="Thandi, 28, Soweto" loading="lazy"><div style="position:absolute;inset:auto 0 0 0;padding:40px 14px 12px;background:linear-gradient(180deg,transparent,rgba(20,12,18,.8));color:#fff;pointer-events:none"><div style="font-size:14.5px;font-weight:700">Thandi, 28 <span style="font-size:11px;color:#7BE0B4"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg></span></div><div style="font-size:11px;opacity:.88">Soweto · amapiano nights</div></div><div style="position:absolute;top:10px;right:10px;background:#fff;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;color:#22A06B;pointer-events:none">90%</div></a>
  </div>
</div>

<div class="dz-section dz-discovery-find" id="find" style="padding:64px 64px 30px;display:grid;grid-template-columns:1fr 1fr;gap:22px">
  <a href="/sign-up" class="dz-df-card" style="display:block;color:inherit;text-decoration:none;cursor:pointer;border-radius:28px;padding:40px 42px;background:linear-gradient(150deg,#FFF3F6,#fff 70%);border:1px solid #FBE3E9;display:flex;gap:26px;align-items:center">
    <div style="flex:1;display:flex;flex-direction:column;gap:13px">
      <span style="font-size:11.5px;font-weight:800;letter-spacing:2px;color:#E8375A"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.15em;flex:none"><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/></svg> DISCOVERY</span>
      <div class="dz-h2-sm" style="font-family:'Instrument Serif',serif;font-size:31px;line-height:1.12">10 people worth meeting. <em>Every day.</em></div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#5F5566">AI-curated matches based on compatibility and what you said matters — reasons included.</p>
      <span style="align-self:flex-start;font-size:13px;font-weight:700;color:#E8375A">Check today's ten →</span>
    </div>
    <div class="dz-df-thumb" style="position:relative;width:150px;height:190px;flex:none">
      <div style="position:absolute;inset:0;border-radius:16px;overflow:hidden;transform:rotate(8deg);box-shadow:0 10px 26px rgba(28,23,32,.14)"><img class="dz-img" src="/images/people/discover-pick-1.webp" alt="Discovery pick" loading="lazy"></div>
      <div style="position:absolute;inset:0;border-radius:16px;overflow:hidden;transform:rotate(-4deg);box-shadow:0 12px 30px rgba(28,23,32,.18)"><img class="dz-img" src="/images/people/discover-pick-2.webp" alt="Discovery pick" loading="lazy"></div>
      <div style="position:absolute;bottom:-10px;right:-10px;background:#E8375A;color:#fff;border-radius:999px;padding:7px 13px;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(232,55,90,.4)">+10</div>
    </div>
  </a>
  <a href="/sign-up" class="dz-df-card" style="display:block;color:inherit;text-decoration:none;cursor:pointer;border-radius:28px;padding:40px 42px;border:1px solid #F0EAEE;display:flex;gap:26px;align-items:center">
    <div style="flex:1;display:flex;flex-direction:column;gap:13px">
      <span style="font-size:11.5px;font-weight:800;letter-spacing:2px;color:#1C1720"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;flex:none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg> FIND</span>
      <div class="dz-h2-sm" style="font-family:'Instrument Serif',serif;font-size:31px;line-height:1.12">Know what you want? <em>Go find them.</em></div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#5F5566">Browse and swipe on your own terms with your own filters — 10 free profiles a day.</p>
      <div style="display:flex;gap:8px;font-size:12px;font-weight:600;color:#5F5566;flex-wrap:wrap">
        <span style="border:1.5px solid #EDE6EB;padding:7px 13px;border-radius:999px">Age 25–34</span><span style="border:1.5px solid #EDE6EB;padding:7px 13px;border-radius:999px">Within 50 km</span><span style="border:1.5px solid #CBEBDC;color:#22A06B;padding:7px 13px;border-radius:999px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg> Verified only</span>
      </div>
    </div>
    <div class="dz-df-thumb" style="width:150px;height:190px;border-radius:16px;overflow:hidden;flex:none;position:relative;box-shadow:0 12px 30px rgba(28,23,32,.14)">
      <img class="dz-img" src="/images/people/browse-teaser.webp" alt="Browse profiles" loading="lazy">
      <div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:8px;pointer-events:none"><span style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;font-size:11px;color:#5F5566"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span><span style="width:30px;height:30px;border-radius:50%;background:#E8375A;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M12 21s-6.7-4.35-9.33-8.2C1.02 10.68 1.6 7.4 4.1 5.7 6.2 4.3 8.9 4.7 10.5 6.6L12 8.3l1.5-1.7c1.6-1.9 4.3-2.3 6.4-.9 2.5 1.7 3.08 5 1.43 7.1C18.7 16.65 12 21 12 21z"/></svg></span></div>
    </div>
  </a>
</div>

<div class="dz-section dz-ai-match" style="margin:64px;background:#FBFAFF;border:1px solid #EFEBFA;border-radius:34px;padding:56px 60px;display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center;position:relative;overflow:hidden">
  <svg width="200" height="200" viewBox="0 0 200 200" style="position:absolute;top:-60px;right:-50px;opacity:.5"><circle cx="100" cy="100" r="90" fill="none" stroke="#E4DBFA" stroke-width="1.5" stroke-dasharray="4 8"></circle><circle cx="100" cy="100" r="60" fill="none" stroke="#E4DBFA" stroke-width="1.5" stroke-dasharray="4 8"></circle></svg>
  <div style="display:flex;flex-direction:column;gap:18px">
    <span style="display:inline-flex;align-self:flex-start;align-items:center;gap:7px;background:#F0EBFF;color:#6C4FE0;font-size:11.5px;font-weight:800;letter-spacing:1.5px;padding:8px 14px;border-radius:999px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.15em;flex:none"><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/></svg> AI MATCHMAKING</span>
    <div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:44px;line-height:1.06">Compatibility that goes <em style="color:#6C4FE0">beyond photos.</em></div>
    <p class="dz-desktop-only" style="margin:0;font-size:15px;line-height:1.7;color:#5F5566;max-width:440px">Our AI learns what matters to you and surfaces people you're more likely to genuinely connect with. You stay in control — it just does the homework.</p>
    <p class="dz-mobile-only" style="margin:0;font-size:14px;line-height:1.6;color:#5F5566;max-width:440px">Our AI learns what matters to you and surfaces people you're more likely to connect with.</p>
    <div class="dz-ai-progress" style="display:flex;flex-direction:column;gap:10px;max-width:410px;font-size:13px;font-weight:600;color:#4A414F">
      <div style="display:flex;align-items:center;justify-content:space-between"><span style="width:120px">Values</span><div style="flex:1;margin:0 14px;height:6px;border-radius:4px;background:#ECE7F2"><div style="width:96%;height:100%;border-radius:4px;background:#22A06B"></div></div><span style="color:#22A06B">96%</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between"><span style="width:120px">Family plans</span><div style="flex:1;margin:0 14px;height:6px;border-radius:4px;background:#ECE7F2"><div style="width:95%;height:100%;border-radius:4px;background:#22A06B"></div></div><span style="color:#22A06B">95%</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between"><span style="width:120px">Communication</span><div style="flex:1;margin:0 14px;height:6px;border-radius:4px;background:#ECE7F2"><div style="width:94%;height:100%;border-radius:4px;background:#22A06B"></div></div><span style="color:#22A06B">94%</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between"><span style="width:120px">Lifestyle</span><div style="flex:1;margin:0 14px;height:6px;border-radius:4px;background:#ECE7F2"><div style="width:91%;height:100%;border-radius:4px;background:#22A06B"></div></div><span style="color:#22A06B">91%</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between"><span style="width:120px">Interests</span><div style="flex:1;margin:0 14px;height:6px;border-radius:4px;background:#ECE7F2"><div style="width:87%;height:100%;border-radius:4px;background:#22A06B"></div></div><span style="color:#22A06B">87%</span></div>
    </div>
  </div>
  <div class="dz-pair-visual" style="display:flex;align-items:center;justify-content:center;gap:24px">
    <a href="/sign-up" class="dz-pair-photo" style="display:block;color:inherit;text-decoration:none;cursor:pointer;width:130px;height:130px;border-radius:50%;overflow:hidden;border:4px solid #fff;box-shadow:0 16px 40px rgba(28,23,32,.16)"><img class="dz-img" src="/images/people/pair-you.webp" alt="You" loading="lazy"></a>
    <div class="dz-pair-connector" style="display:flex;flex-direction:column;align-items:center;gap:8px">
      <svg width="120" height="18" viewBox="0 0 120 18"><path d="M2 9 H 118" stroke="#C9BCF2" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round"></path></svg>
      <div style="position:relative;width:118px;height:118px;display:flex;align-items:center;justify-content:center">
        <svg width="118" height="118" viewBox="0 0 118 118" style="position:absolute"><circle cx="59" cy="59" r="51" fill="#fff"></circle><circle cx="59" cy="59" r="51" fill="none" stroke="#ECE7F2" stroke-width="8"></circle><circle cx="59" cy="59" r="51" fill="none" stroke="#22A06B" stroke-width="8" stroke-dasharray="295 321" stroke-linecap="round" transform="rotate(-90 59 59)"></circle></svg>
        <div style="text-align:center;position:relative"><div style="font-size:30px;font-weight:800">92%</div><div style="font-size:10.5px;font-weight:700;color:#6C4FE0">Exceptional</div></div>
      </div>
      <svg width="120" height="18" viewBox="0 0 120 18"><path d="M2 9 H 118" stroke="#C9BCF2" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round"></path></svg>
    </div>
    <a href="/sign-up" class="dz-pair-photo" style="display:block;color:inherit;text-decoration:none;cursor:pointer;width:130px;height:130px;border-radius:50%;overflow:hidden;border:4px solid #fff;box-shadow:0 16px 40px rgba(28,23,32,.16)"><img class="dz-img" src="/images/people/pair-them.webp" alt="Your match" loading="lazy"></a>
  </div>
</div>

<div class="dz-section dz-cities" id="cities" style="padding:6px 64px 26px">
  <div class="dz-section-head" style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px">
    <div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:44px">Across SA, <em style="color:#E8375A">love lives here.</em></div>
    <a href="/cities" style="font-size:13.5px;font-weight:700;color:#E8375A;text-decoration:none;cursor:pointer">See all cities →</a>
  </div>
  <div class="dz-cities-grid" style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1.5fr 1fr 1fr;gap:14px">
    <a href="/cities" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/cape-town.webp" alt="Cape Town" loading="lazy"></a>
    <a href="/cities" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/johannesburg.webp" alt="Johannesburg" loading="lazy"></a>
    <a href="/cities" class="dz-extra-3" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/durban.webp" alt="Durban" loading="lazy"></a>
    <a href="/cities" class="dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/pretoria.webp" alt="Pretoria" loading="lazy"></a>
    <a href="/cities" class="dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/gqeberha.webp" alt="Gqeberha" loading="lazy"></a>
    <a href="/cities" class="dz-extra-4plus" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;height:190px;border-radius:20px;overflow:hidden"><img class="dz-img" src="/images/places/bloemfontein.webp" alt="Bloemfontein" loading="lazy"></a>
  </div>
</div>

<div class="dz-section dz-lifestyle" id="sa-lifestyle" style="padding:58px 64px;display:grid;grid-template-columns:380px 1fr;gap:48px;align-items:center">
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:44px;line-height:1.08">It's more than dating. It's <em style="color:#F5B62E">your next chapter.</em></div>
    <p style="margin:0;font-size:14.5px;line-height:1.65;color:#5F5566">Dates, adventures, new places and real connections — from first coffee to weekend getaway.</p>
    <a href="/lifestyle" style="align-self:flex-start;background:#1C1720;color:#fff;padding:15px 30px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;display:inline-block">Explore SA Lifestyle</a>
  </div>
  <div class="dz-lifestyle-mosaic" style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:145px;gap:13px">
    <a href="/lifestyle" class="dz-lifestyle-card--tall" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:18px;overflow:hidden;grid-row:span 2"><img class="dz-img" src="/images/lifestyle/city-nights.webp" alt="City nights — bright lights, big vibes" loading="lazy"></a>
    <a href="/lifestyle" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:18px;overflow:hidden"><img class="dz-img" src="/images/lifestyle/beach-days.webp" alt="Beach days — sun, sea, good company" loading="lazy"></a>
    <a href="/lifestyle" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:18px;overflow:hidden"><img class="dz-img" src="/images/lifestyle/road-trips.webp" alt="Road trips — new places, new stories" loading="lazy"></a>
    <a href="/lifestyle" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:18px;overflow:hidden"><img class="dz-img" src="/images/lifestyle/good-food.webp" alt="Good food — local flavours, real good" loading="lazy"></a>
    <a href="/lifestyle" style="display:block;color:inherit;text-decoration:none;cursor:pointer;position:relative;border-radius:18px;overflow:hidden"><img class="dz-img" src="/images/lifestyle/live-events.webp" alt="Live events — music, culture, connection" loading="lazy"></a>
  </div>
</div>

<div class="dz-section dz-realme" id="safety" style="margin:0 64px 64px;background:#F2FAF6;border:1px solid #DBF0E5;border-radius:34px;padding:52px 58px;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center">
  <div style="display:flex;flex-direction:column;gap:16px">
    <span style="display:inline-flex;align-self:flex-start;align-items:center;gap:8px;background:#22A06B;color:#fff;font-size:11.5px;font-weight:800;letter-spacing:1.5px;padding:8px 15px;border-radius:999px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg> REALME</span>
    <div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:42px;line-height:1.08">Real people should meet <em style="color:#22A06B">real people.</em></div>
    <p style="margin:0;font-size:14.5px;line-height:1.7;color:#4A5B51;max-width:440px">We built trust into dating. Every RealMe member passes selfie verification and liveness checks — so the face on the profile is the person at the table.</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12.5px;font-weight:600;color:#2E6B4F">
      <span style="background:#fff;border:1px solid #DBF0E5;padding:9px 15px;border-radius:999px">Selfie verification</span>
      <span style="background:#fff;border:1px solid #DBF0E5;padding:9px 15px;border-radius:999px">Liveness checks</span>
      <span style="background:#fff;border:1px solid #DBF0E5;padding:9px 15px;border-radius:999px">Trust signals</span>
      <span style="background:#fff;border:1px solid #DBF0E5;padding:9px 15px;border-radius:999px">Report &amp; block</span>
      <span style="background:#fff;border:1px solid #DBF0E5;padding:9px 15px;border-radius:999px">Privacy controls</span>
    </div>
  </div>
  <div style="display:flex;justify-content:center">
    <div class="dz-realme-card" style="background:#fff;border-radius:26px;padding:28px;box-shadow:0 22px 55px rgba(34,160,107,.16);display:flex;flex-direction:column;gap:16px;width:330px">
      <div style="display:flex;align-items:center;gap:14px">
        <a href="/dating-safely" style="display:block;color:inherit;text-decoration:none;cursor:pointer;width:64px;height:64px;border-radius:50%;overflow:hidden"><img class="dz-img" src="/images/people/verify-selfie.webp" alt="Selfie verification in progress" loading="lazy"></a>
        <div><div style="font-size:15px;font-weight:700">Verifying selfie…</div><div style="font-size:12px;color:#7A6F80">Matches profile photos</div></div>
      </div>
      <div style="height:8px;border-radius:5px;background:#EDF6F1"><div style="width:82%;height:100%;border-radius:5px;background:#22A06B"></div></div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:600;color:#2E6B4F">
        <span><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg> Real person detected</span>
        <span><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg> Face matches profile</span>
        <span style="color:#9AA69F"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><circle cx="12" cy="12" r="9"/></svg> Issuing RealMe badge…</span>
      </div>
    </div>
  </div>
</div>

<div class="dz-section dz-showcase" id="how-it-works" style="padding:0 64px 70px;display:grid;grid-template-columns:1fr 460px;gap:48px;align-items:center">
  <div class="dz-phones" style="display:flex;gap:18px;justify-content:center">
    <div class="dz-phone-frame" style="width:215px;background:#1C1720;border-radius:32px;padding:8px;box-shadow:0 24px 60px rgba(28,23,32,.25);transform:rotate(-3deg)">
      <div class="dz-phone-screen" style="background:#fff;border-radius:26px;overflow:hidden;height:430px;display:flex;flex-direction:column">
        <div style="padding:12px 14px 8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;font-weight:800">Discovery</span><span style="font-size:9px;color:#E8375A;font-weight:700">3 of 10</span></div>
        <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;flex:1;margin:0 10px;border-radius:16px;overflow:hidden;position:relative"><img class="dz-img" src="/images/people/naledi.webp" alt="Naledi, 29" loading="lazy"><div style="position:absolute;left:8px;bottom:8px;color:#fff;font-size:11px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.7);pointer-events:none">Naledi, 29 <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M20 6 9 17l-5-5"/></svg> · 94%</div></a>
        <div style="display:flex;justify-content:center;gap:12px;padding:10px"><span style="width:30px;height:30px;border-radius:50%;background:#F4F0F3;display:flex;align-items:center;justify-content:center;font-size:11px;color:#7A6F80"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span><span style="width:34px;height:34px;border-radius:50%;background:#E8375A;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M12 21s-6.7-4.35-9.33-8.2C1.02 10.68 1.6 7.4 4.1 5.7 6.2 4.3 8.9 4.7 10.5 6.6L12 8.3l1.5-1.7c1.6-1.9 4.3-2.3 6.4-.9 2.5 1.7 3.08 5 1.43 7.1C18.7 16.65 12 21 12 21z"/></svg></span><span style="width:30px;height:30px;border-radius:50%;background:#F4F0F3;display:flex;align-items:center;justify-content:center;font-size:10px"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:-0.125em;flex:none"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.5 6.1-.1 1-.5 2.4-1.4 3.7 1.7-.2 3.3-.9 4.5-1.8 1 .3 2.2.5 3.4.5 5.5 0 10-3.6 10-8s-4.5-8-10-8z"/></svg></span></div>
      </div>
    </div>
    <div class="dz-phone-frame" style="width:215px;background:#1C1720;border-radius:32px;padding:8px;box-shadow:0 24px 60px rgba(28,23,32,.25);z-index:1">
      <div class="dz-phone-screen dz-phone-screen--match" style="background:#fff;border-radius:26px;overflow:hidden;height:430px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center">
        <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;display:flex"><div style="width:66px;height:66px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.15)"><img class="dz-img" src="/images/people/match-you.webp" alt="You" loading="lazy"></div><div style="width:66px;height:66px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.15);margin-left:-16px"><img class="dz-img" src="/images/people/match-them.webp" alt="Your match" loading="lazy"></div></a>
        <div style="font-family:'Instrument Serif',serif;font-size:23px;color:#E8375A">It's a Match!</div>
        <div style="font-size:11px;color:#7A6F80;line-height:1.5">You and Aisha liked each other</div>
        <a href="/sign-up" style="background:#E8375A;color:#fff;font-size:11px;font-weight:700;padding:10px 22px;border-radius:999px;text-decoration:none;cursor:pointer;display:inline-block">Send a message</a>
        <a href="/sign-up" style="font-size:11px;font-weight:600;color:#7A6F80;text-decoration:none;cursor:pointer">Keep exploring</a>
      </div>
    </div>
    <div class="dz-phone-frame dz-phone-messages" style="width:215px;background:#1C1720;border-radius:32px;padding:8px;box-shadow:0 24px 60px rgba(28,23,32,.25);transform:rotate(3deg)">
      <div class="dz-phone-screen" style="background:#fff;border-radius:26px;overflow:hidden;height:430px;display:flex;flex-direction:column">
        <div style="padding:12px 14px;font-size:11px;font-weight:800;border-bottom:1px solid #F4F0F3">Messages</div>
        <div style="display:flex;flex-direction:column;gap:2px;padding:8px">
          <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;display:flex;gap:8px;align-items:center;padding:7px;border-radius:10px;background:#FFF6F8"><div style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex:none"><img class="dz-img" src="/images/people/aisha.webp" alt="Aisha" loading="lazy"></div><div style="min-width:0"><div style="font-size:10.5px;font-weight:700">Aisha</div><div style="font-size:9.5px;color:#7A6F80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">That sunset was amazing 🌅</div></div><span style="margin-left:auto;width:7px;height:7px;border-radius:50%;background:#E8375A;flex:none"></span></a>
          <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;display:flex;gap:8px;align-items:center;padding:7px"><div style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex:none"><img class="dz-img" src="/images/people/sipho.webp" alt="Sipho" loading="lazy"></div><div style="min-width:0"><div style="font-size:10.5px;font-weight:700">Sipho</div><div style="font-size:9.5px;color:#7A6F80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Down for a hike Saturday?</div></div></a>
          <a href="/sign-up" style="display:block;color:inherit;text-decoration:none;cursor:pointer;display:flex;gap:8px;align-items:center;padding:7px"><div style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex:none"><img class="dz-img" src="/images/people/lerato.webp" alt="Lerato" loading="lazy"></div><div style="min-width:0"><div style="font-size:10.5px;font-weight:700">Lerato</div><div style="font-size:9.5px;color:#7A6F80;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Loved your playlist!</div></div></a>
        </div>
      </div>
    </div>
  </div>
  <div class="dz-showcase-copy" style="display:flex;flex-direction:column;gap:18px">
    <span style="font-size:11.5px;font-weight:800;letter-spacing:2px;color:#E8375A">HOW IT WORKS</span>
    <div class="dz-h2" style="font-family:'Instrument Serif',serif;font-size:42px;line-height:1.08">Technology that brings the right people together.</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;gap:14px"><span style="width:26px;height:26px;border-radius:8px;background:#F5B62E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none">1</span><div><b style="font-size:14.5px">Tell us about you</b><div style="font-size:13px;color:#5F5566;line-height:1.55;margin-top:3px">Create your profile and share what matters most.</div></div></div>
      <div style="display:flex;gap:14px"><span style="width:26px;height:26px;border-radius:8px;background:#6C4FE0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none">2</span><div><b style="font-size:14.5px">We do the homework</b><div style="font-size:13px;color:#5F5566;line-height:1.55;margin-top:3px">AI matching surfaces people you'll genuinely connect with.</div></div></div>
      <div style="display:flex;gap:14px"><span style="width:26px;height:26px;border-radius:8px;background:#E8375A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none">3</span><div><b style="font-size:14.5px">Start something real</b><div style="font-size:13px;color:#5F5566;line-height:1.55;margin-top:3px">Chat, vibe and build something that could last.</div></div></div>
    </div>
    <a href="/how-it-works" style="align-self:flex-start;font-size:13.5px;font-weight:700;color:#E8375A;text-decoration:none;cursor:pointer">Learn more about how it works →</a>
  </div>
</div>

<div class="dz-section dz-cta" id="get-app" style="position:relative;margin:0 64px 30px;background:#1C1720;border-radius:36px;padding:80px 60px;text-align:center;overflow:hidden">
  <svg width="120" height="90" viewBox="0 0 120 90" style="position:absolute;top:30px;left:80px;opacity:.85"><path d="M10 74 C 30 36, 60 26, 74 42 C 82 52, 70 62, 62 54 C 54 46, 70 28, 106 20" fill="none" stroke="#F5B62E" stroke-width="2.5" stroke-linecap="round"></path></svg>
  <svg width="56" height="50" viewBox="0 0 46 40" style="position:absolute;bottom:40px;right:100px;animation:dz-pulse 2.6s ease-in-out infinite"><path d="M23 36S6 26 6 15.2C6 8.8 11 4.5 16.2 4.5c2.5 0 4.7 1 5.8 2.6 1.1-1.6 3.3-2.6 5.8-2.6C33 4.5 38 8.8 38 15.2 38 26 23 36 23 36z" fill="none" stroke="#E8375A" stroke-width="2.5"></path></svg>
  <div class="dz-cta-title" style="font-family:'Instrument Serif',serif;font-size:64px;line-height:1.05;color:#fff">Your person is out there.<br><em style="color:#FF6B8A">Right here.</em></div>
  <p style="margin:22px auto 0;font-size:15.5px;line-height:1.6;color:rgba(255,255,255,.7);max-width:440px">Join free, get RealMe verified, and meet your ten for today.</p>
  <div class="dz-cta-actions" style="display:flex;justify-content:center;gap:14px;margin-top:32px">
    <a href="/sign-up" style="background:#E8375A;color:#fff;padding:18px 40px;border-radius:999px;font-size:15.5px;font-weight:700;box-shadow:0 14px 40px rgba(232,55,90,.45);text-decoration:none;cursor:pointer;display:inline-block">Join DateZA Free →</a>
    <a href="/get-the-app" style="border:1.5px solid rgba(255,255,255,.35);color:#fff;padding:18px 34px;border-radius:999px;font-size:15.5px;font-weight:600;text-decoration:none;cursor:pointer;display:inline-block">Get the app</a>
  </div>
</div>

<div class="dz-section dz-footer" style="display:flex;align-items:center;justify-content:space-between;padding:22px 64px 30px;font-size:12px;color:#9A8F98">
  <a href="#top" style="display:flex;align-items:center;gap:7px;color:inherit;text-decoration:none;cursor:pointer"><svg width="15" height="15" viewBox="0 0 30 30"><path d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z" fill="#E8375A"></path></svg><b style="color:#1C1720">DateZA</b> · NO DNA. JUST RSA. 🇿🇦</a>
  <div style="display:flex;gap:24px"><a href="/dating-safely" style="color:inherit;text-decoration:none;cursor:pointer">Safety</a><a href="/privacy" style="color:inherit;text-decoration:none;cursor:pointer">Privacy</a><a href="/help" style="color:inherit;text-decoration:none;cursor:pointer">Help Centre</a><a href="/careers" style="color:inherit;text-decoration:none;cursor:pointer">Careers</a></div>
  <span>© 2026 DateZA. All rights reserved.</span>
</div>
</div>`;

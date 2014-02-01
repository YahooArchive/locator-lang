YUI.add("demo-lang-bar",function(Y, NAME){
   Y.Intl.add("demo/bar", "en", {"BAR":["bar entry"],"COM":[{"type":"plural","valueName":"COMPANY_COUNT","options":{"one":"One company","other":"${#} companies"}}," published new books."],"TRA":["${TRAVELLERS}"," went to ","${CITY}"]});
}, "", {requires: ["intl"]});
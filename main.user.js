// ==UserScript==
// @name         AtCoderCenterMyStanding
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  デフォルトで自身の順位付近を表示するようにします
// @author       haruomaki
// @match        https://atcoder.jp/*standings*
// @match        https://atcoder.jp/*results*
// @exclude      https://atcoder.jp/*standings/json
// @grant        none
// @license      MIT
// ==/UserScript==

// TODO: バーチャル順位表に対応

(function () {
    'use strict';
    /* global vueStandings, vueResults, userScreenName */

    // Configs
    // ---------------------------
    const default_center = true;
    // ---------------------------

    var vue;
    if (vueStandings) {
        vue = vueStandings;
    } else if (vueResults) {
        vue = vueResults;
    } else {
        console.error("順位データが読み込めません");
        return;
    }

    function clickActivePagination() {
        // ページネーション内のリンク要素を取得
        const linkElement = document.querySelector('#vue-standings .pagination .active a')
        linkElement.click();
    }

    function center_me() {
        clickActivePagination(); // 一度クリックしておかないと、なぜかページ移動が効かない

        const user_id = userScreenName;
        const fl = vueStandings.standings.StandingsData.filter(data => data.UserScreenName == user_id);
        if (fl.length == 0) {
            console.info("自ユーザが順位表に掲載されていません");
            return;
        };
        const mydata = fl[0];
        const rank = mydata.Rank;

        const target_page = Math.ceil(rank / vue.perPage);
        console.debug("center me:", { user_id, rank, target_page });
        vue.page = target_page; // これで遷移
    }

    function main() {
        // 自身の順位をクリックするとページ移動
        const rank_cell = document.querySelector("#standings-tbody .info td.standings-rank")
        rank_cell.innerHTML = "<a href>" + rank_cell.innerHTML + "</a>"
        rank_cell.addEventListener('click', function (event) {
            event.preventDefault();
            center_me();
        });

        if (default_center) center_me();
    }

    // 順位表本体が読み込まれるまで待機
    const interval = setInterval(() => {
        if (vue.standings || vue.results) {
            clearInterval(interval);
            main();
        }
    }, 100);
})();

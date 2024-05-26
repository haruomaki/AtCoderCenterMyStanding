// ==UserScript==
// @name         AtCoderCenterMyStanding
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  デフォルトで自身の順位付近を表示するようにします
// @author       haruomaki
// @match        https://atcoder.jp/*standings*
// @match        https://atcoder.jp/*results*
// @grant        none
// @license      MIT
// ==/UserScript==

// TODO: バーチャル順位表に対応
// FIXME: レーティング変動ページでリンクが消滅
// FIXME: ソート基準を順位以外にしたとき

(function () {
    'use strict';
    /* global vueStandings, vueResults */

    // Configs
    // ---------------------------
    const default_center = false;
    // ---------------------------

    var first_click = false;

    function exists(name) {
        try {
            return typeof window[name] !== 'undefined';
        } catch (e) {
            return false;
        }
    }

    var vue;
    if (exists("vueStandings")) {
        vue = vueStandings;
    } else if (exists("vueResults")) {
        vue = vueResults;
    } else {
        console.error("順位データが読み込めません");
        return;
    }

    function getRankElement() {
        if (exists("vueStandings")) {
            return document.querySelector("#standings-tbody .info td.standings-rank");
        }
        if (exists("vueResults")) {
            return document.querySelector(".info td:nth-child(2)");
        }
    }

    function myRank() {
        const rank_cell = getRankElement();
        const str = rank_cell.innerText;
        const match = str.match(/\d+(?=\D*$)/);
        return match ? parseInt(match[0], 10) : NaN;
    }

    function clickActivePagination() {
        // ページネーション内のリンク要素を取得
        const linkElement = document.querySelector('.pagination .active a')
        linkElement.click();
    }

    function center_me() {
        if (!first_click) {
            first_click = true;
            clickActivePagination(); // 一度クリックしておかないと、なぜかページ移動が効かない
        }

        const rank = myRank();

        const target_page = Math.ceil(rank / vue.perPage);
        console.debug("center me:", { rank, target_page });
        vue.page = target_page; // これで遷移
    }

    function main() {
        // 自身の順位をクリックするとページ移動
        const rank_cell = getRankElement();
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

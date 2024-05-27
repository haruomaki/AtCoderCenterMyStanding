// ==UserScript==
// @name         AtCoderCenterMyStanding
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  デフォルトで自身の順位付近を表示するようにします
// @author       haruomaki
// @match        https://atcoder.jp/*standings*
// @match        https://atcoder.jp/*results*
// @grant        none
// @license      MIT
// ==/UserScript==

// TODO: バーチャル順位表に対応
// FIXME: ソート基準を順位以外にしたとき

(function () {
    'use strict';
    /* global vueStandings, vueResults */

    // Configs
    // ---------------------------
    const default_center = true;
    // ---------------------------

    var first_click = false;
    var current_row = null;

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

    function getMyStanding() {
        return document.querySelector("tr.info");
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

    function remakeClickable() {
        if (current_row != null) {
            //console.debug("クリック機能削除:", current_row);
            current_row.removeAttribute('title');
            current_row.removeEventListener('click', center_me);
        }
        const row = getMyStanding();
        //console.debug("クリック可能にします:", row);
        row.setAttribute('title', 'Click to center my standing');
        row.addEventListener('click', center_me);
        current_row = row;
    }

    function main() {
        // 自身の順位をクリックするとページ移動
        remakeClickable();

        // クリック可能なクラスを定義
        const clickableClassName = 'info';

        // 自順位の行が移動もしくは生成されるたびにremake
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // 新しいノードが追加された場合
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('info')) {
                            console.debug('<tr class="info"> が追加されました');
                            remakeClickable();
                        }
                    });
                } else if (mutation.type === 'attributes' && mutation.target.classList.contains('info')) {
                    // 既存のノードにinfoクラスが付与された場合
                    console.debug('<tr> に infoクラスが付与されました');
                    remakeClickable();
                }
            }
        });

        // 監視を開始する
        observer.observe(document.body, { childList: true, attributes: true, attributeFilter: ['class'], subtree: true });

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

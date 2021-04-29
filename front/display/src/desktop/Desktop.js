import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { interval, BehaviorSubject, timer, combineLatest } from "rxjs";
import {
  tap,
  filter,
  debounce,
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  delay,
} from "rxjs/operators";
import "./Desktop.css";
import logo from "./assets/loading.svg";
import thumbUp from "../common/assets/thumbUp.svg";
import thumbDown from "../common/assets/thumbDown.svg";
import twitter from "../common/assets/twitter.svg";
import shuffle from "../common/helpers/shuffleArray";

moment.locale('fr')

const MIN_HEIGHT = 360;
const MIN_WIDTH = 480;
const BORDER_SIZE = 40;

const REFRESH_NEWS_DELAY = 1000 * 60 * 20;
const REFRESH_ITEM_DELAY = 1000 * 10;

const FETCH_URL = "api/news";

let DATA_INDEX = 0;
let DISPLAYED_ITEMS = [];
let DISPLAYED_ITEMS_INDEX = 0;
let HARD_RESET = false;

const windowSize$ = new BehaviorSubject([
  window.innerWidth,
  window.innerHeight,
]).pipe(debounce(() => timer(500)));

const xNb$ = windowSize$.pipe(
  map(([width]) =>
    Math.floor((width - BORDER_SIZE) / (MIN_WIDTH + BORDER_SIZE))
  ),
  map((nb) => (nb <= 0 ? 1 : nb)),
  distinctUntilChanged()
);
const yNb$ = windowSize$.pipe(
  map(([_, height]) =>
    Math.floor((height - BORDER_SIZE) / (MIN_HEIGHT + BORDER_SIZE))
  ),
  map((nb) => (nb <= 0 ? 1 : nb)),
  distinctUntilChanged()
);

const itemsNb$ = combineLatest(xNb$, yNb$).pipe(
  map(([xNb, yNb]) => xNb * yNb),
  distinctUntilChanged()
);

const itemWidth$ = combineLatest(xNb$, windowSize$).pipe(
  map(([xNb, [width]]) => Math.floor((width - BORDER_SIZE) / xNb) - BORDER_SIZE)
);

const itemHeight$ = combineLatest(yNb$, windowSize$).pipe(
  map(
    ([yNb, [_, height]]) =>
      Math.floor((height - BORDER_SIZE) / yNb) - BORDER_SIZE
  )
);

const itemSize$ = combineLatest(itemWidth$, itemHeight$).pipe(
  map(([itemWidth, itemHeight]) => [itemWidth, itemHeight])
);

const plusTwo = (count) => count + 2;
const httpResOk = (res) =>
  res.status === 200 && res.data && res.data.length > 0;
const httpData = (res) => res.data;
const fetchData = () => axios.get(FETCH_URL);
const hardReset = () => {
  HARD_RESET = true;
};
const inspect = (data) => {
   const x = data.reduce((acc, val) => {
    if (val.type === 'RSS') {
        if (acc[val.theme]) {
            return ({...acc, [val.theme]: acc[val.theme] + 1})
        } else {
            return ({...acc, [val.theme]: 1})
        }
    } else if (val.type === 'tweet') {
        if (acc[val.type]) {
            return ({...acc, [val.type]: acc[val.type] + 1})
        } else {
            return ({...acc, [val.type]: 1})
        }
    }
   }, {});
   console.log(x)
}

const fetchNews$ = interval(REFRESH_NEWS_DELAY).pipe(
  map(plusTwo),
  startWith(1),
  switchMap(fetchData),
  filter(httpResOk),
  map(httpData),
  tap(inspect),
  map(shuffle),
  tap(hardReset)
);

const update$ = interval(REFRESH_ITEM_DELAY).pipe(map(plusTwo), startWith(1));

const itemsNotEmpty = () => DISPLAYED_ITEMS.length > 0;
const computeDisappear = () => {
  const newItems = [...DISPLAYED_ITEMS];
  newItems[DISPLAYED_ITEMS_INDEX] = {
    ...DISPLAYED_ITEMS[DISPLAYED_ITEMS_INDEX],
    disappear: true,
  };
  return newItems;
};

const disappear$ = interval(REFRESH_ITEM_DELAY).pipe(
  map(plusTwo),
  startWith(1),
  delay(REFRESH_ITEM_DELAY - 1 * 1000),
  filter(itemsNotEmpty),
  map(computeDisappear)
);

const timer500 = () => timer(500);
const computeCurrentItems = ([data, nb]) => {
  if (HARD_RESET || nb !== DISPLAYED_ITEMS.length) {
    const tmpItems = [];
    for (let i = 0; i < nb; i++) {
      tmpItems[i] = data[i];
    }
    DATA_INDEX = nb;
    DISPLAYED_ITEMS_INDEX = 0;
    DISPLAYED_ITEMS = tmpItems;
    HARD_RESET = false;
    return DISPLAYED_ITEMS;
  }
  const newItems = [...DISPLAYED_ITEMS];
  newItems[DISPLAYED_ITEMS_INDEX] = data[DATA_INDEX];
  DISPLAYED_ITEMS_INDEX =
    DISPLAYED_ITEMS_INDEX === nb - 1 ? 0 : DISPLAYED_ITEMS_INDEX + 1;
  DATA_INDEX = DATA_INDEX === data.length - 1 ? 0 : DATA_INDEX + 1;
  DISPLAYED_ITEMS = newItems;
  return DISPLAYED_ITEMS;
};

const currentItems$ = combineLatest(fetchNews$, itemsNb$, update$).pipe(
  debounce(timer500),
  map(computeCurrentItems)
);

function App() {
  const [itemSize, setItemSize] = useState([0, 0]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handleResize = () =>
      windowSize$.next([window.innerWidth, window.innerHeight]);

    window.addEventListener("resize", handleResize);

    let itemSizeSub = itemSize$.subscribe(setItemSize);

    let updateItemsSub = currentItems$.subscribe(setItems);

    let disappearSub = disappear$.subscribe(setItems);

    return () =>
      itemSizeSub.unsubscribe() &&
      updateItemsSub.unsubscribe() &&
      disappearSub.unsubscribe() &&
      window.removeEventListener("resize", handleResize);
  }, []);

  function handleClick(item) {
    if (item.type === 'RSS') {
        return function () {
          window.open(item.url, "_blank");
        };
    } else if (item.type === 'tweet') {
        return function () {
          window.open(`https://twitter.com/i/web/status/${item.id}`);
        };
    }
  }

  function getFollowersCount(nb) {
    const k = nb/1000;
    if (k > 1000) {
     const m = k / 1000;     
     return `${m.toFixed(1)} M`
    } else if (k > 1) {
     return `${k.toFixed(1)} k`
    } else {
        return nb;
    }
  }

  function printItem(item) {
    if (item.type === "RSS") {
      return (
        <div
          onClick={handleClick(item)}
          key={item.title}
          style={{
            width: itemSize[0] + "px",
            height: itemSize[1] + "px",
          }}
          className={`item desktop ${item.disappear ? "disappear" : "appear"}`}
        >
          <div
            className="item-picture"
            style={{ backgroundImage: 'url("' + item.image + '")' }}
          >
            <div style={{ flex: 2 }}></div>
            <div className="item-title">{item.title}</div>
          </div>
          <div className="item-content">
            <div className="item-description">
              {item.description && item.description.length > 250
                ? item.description.substr(0, 250).concat("[...]")
                : item.description}
            </div>
            <div className="item-meta">
              <div className="item-date">{item.date || ""}</div>
              <div className="item-author">
                {item.source}
                {item.author && item.author !== item.source
                  ? `, ${item.author}`
                  : ""}
              </div>
            </div>
          {/*
            <div className="item-like-dislike">
              <div className="item-dislike">
                <img width="64" src={thumbDown} alt="thumb down" />
                <span>Bof, la thematique {item.theme}, je suis pas fan</span>
              </div>
              <div className="item-like">
                <img width="64" src={thumbUp} alt="thumb up" />
                <span>
                  Oui ! Ce contenu m'interesse et j'aimerais en voir d'avantage
                </span>
              </div>
            </div>
            */}
          </div>
        </div>
      );
    } else if (item.type === "tweet") {
      return (
        <div
          onClick={handleClick(item)}
          key={item.id}
          style={{
            width: itemSize[0] + "px",
            height: itemSize[1] + "px",
          }}
          className={`item desktop ${item.disappear ? "disappear" : "appear"}`}
        >
          <div className="tweet-item-header">
            <div className="tweet-item-header-left">
                  <img
                    src={item.user.profilePicture}
                    className="tweet-item-profile-picture"
                    alt="twitter profile"
                  />
              <div>
                <span className="tweet-item-user-name">{item.user.name}</span>
                <br />
                <span className="tweet-item-user-screen-name">@{item.user.screenName}, { getFollowersCount(item.user.followers)} abonnés</span>
              </div>
            </div>
            <div className="tweet-item-header-right">
              <span>{ moment(item.createdAt).fromNow() }</span>
              <img width="32" src={twitter} alt="twitter logo" />
            </div>
          </div>
          <div className="tweet-item-content">
            <div className="tweet-item-text">
              {item.text.replace(/https:\/\/t\.co\/[a-zA-Z0-9]*/, "")}
            </div>
            {item.entities.media && item.entities.media.length > 0 && (
              <div className="tweet-item-media" style={{backgroundImage: `url('${item.entities.media[0].media_url_https}')`}}>
              </div>
            )}
            {!item.entities.media && item.user.profileBanner && (
              <div className="tweet-item-media" style={{backgroundImage: `url('${item.user.profileBanner}')`}}>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="container">
      {items && items.length > 0 && items.map(printItem)}
      {(!items || items.length === 0) && <img src={logo} alt="loading" />}
    </div>
  );
}

export default App;

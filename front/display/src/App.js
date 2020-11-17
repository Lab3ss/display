import React, { useState, useEffect } from "react";
import axios from "axios";
import { interval, BehaviorSubject, timer, combineLatest } from "rxjs";
import {
  tap,
  filter,
  debounce,
  map,
  startWith,
  distinctUntilChanged,
  switchMap,
  delay
} from "rxjs/operators";
import "./App.css";

import logo from "./loading.svg";

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
  window.innerHeight
]).pipe(debounce(() => timer(500)));

const xNb$ = windowSize$.pipe(
  map(([width]) =>
    Math.floor((width - BORDER_SIZE) / (MIN_WIDTH + BORDER_SIZE))
  ),
  map(nb => nb <= 0 ? 1 : nb),
  distinctUntilChanged()
);
const yNb$ = windowSize$.pipe(
  map(([_, height]) =>
    Math.floor((height - BORDER_SIZE) / (MIN_HEIGHT + BORDER_SIZE))
  ),
  map(nb => nb <= 0 ? 1 : nb),
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

const plusTwo = count => count + 2;
const httpResOk = res => res.status === 200 && res.data && res.data.length > 0;
const httpData = res => res.data;
const fetchData = () => axios.get(FETCH_URL);
const hardReset = () => {
  HARD_RESET = true;
};

const fetchNews$ = interval(REFRESH_NEWS_DELAY).pipe(
  map(plusTwo),
  startWith(1),
  switchMap(fetchData),
  filter(httpResOk),
  map(httpData),
  tap(hardReset)
);

const update$ = interval(REFRESH_ITEM_DELAY).pipe(map(plusTwo), startWith(1));

const itemsNotEmpty = () => DISPLAYED_ITEMS.length > 0;
const computeDisappear = () => {
  const newItems = [...DISPLAYED_ITEMS];
  newItems[DISPLAYED_ITEMS_INDEX] = {
    ...DISPLAYED_ITEMS[DISPLAYED_ITEMS_INDEX],
    disappear: true
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
    return function() {
      window.open(item.url, "_blank");
    }
  }

  function printItem(item) {
    return (
      <div key={item.title} className="">
        <div
          onClick={handleClick(item)}
          style={{
            width: itemSize[0] + "px",
            height: itemSize[1] + "px"
          }}
          className={`item ${item.disappear ? "disappear" : "appear"}`}
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
              <div className="item-author">{item.source}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {items && items.length > 0 && items.map(printItem)}
      {(!items || items.length === 0) && <img src={logo} alt="loading" />}
    </div>
  );
}

export default App;

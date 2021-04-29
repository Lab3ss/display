import React, { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import shuffle from "../common/helpers/shuffleArray";
import "./Mobile.css";

import loading from "./assets/loading.svg";
import me from "../common/assets/me.jpeg";

const FETCH_URL = "api/news";

const DELTA_LEFT = 80;
const DELTA_RIGHT = 80;
const DELTA_TOP = 120;

function App() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [opacityIndicatorLeft, setOpacityIndicatorLeft] = useState(0);
  const [opacityIndicatorRight, setOpacityIndicatorRight] = useState(0);
  const [likes, setLikes] = useState({});
  const [showCounters, setShowCounters] = useState(false);

  useEffect(() => {
    document.body.addEventListener("touchmove", function (e) {
      e.preventDefault();
    });
    axios.get(FETCH_URL).then((res) => {
      if (res && res.status === 200 && res.data && res.data.length > 0) {
        setItems(shuffle(res.data));
      }
    });
  }, []);

  const swiped = useSwipeable({
    onSwiping: (event) => {
      switch (event.dir) {
        case "Left":
          setOpacityIndicatorRight(0);
          setOpacityIndicatorLeft((event.absX / DELTA_LEFT) * 0.8);
          break;
        case "Right":
          setOpacityIndicatorLeft(0);
          setOpacityIndicatorRight((event.absX / DELTA_RIGHT) * 0.8);
          break;
        case "Up":
          setOpacityIndicatorLeft(0);
          setOpacityIndicatorRight(0);
          break;
        case "Down":
          setOpacityIndicatorLeft(0);
          setOpacityIndicatorRight(0);
          break;
        default:
          break;
      }
    },
    onSwipedLeft: (event) => {
      setOpacityIndicatorLeft(0);
      if (event.absX >= DELTA_LEFT) {
        const theme = items[cursor].theme;
        if (likes[theme] !== undefined) {
          setLikes({ ...likes, [theme]: likes[theme] - 1 });
        } else {
          setLikes({ ...likes, [theme]: -1 });
        }
        setCursor(cursor + 1);
      }
    },
    onSwipedRight: (event) => {
      setOpacityIndicatorRight(0);
      if (event.absX >= DELTA_RIGHT) {
        const theme = items[cursor].theme;
        if (likes[theme] !== undefined) {
          setLikes({ ...likes, [theme]: likes[theme] + 1 });
        } else {
          setLikes({ ...likes, [theme]: 1 });
        }
        setCursor(cursor + 1);
      }
    },
    onSwipedUp: (event) => {
      console.log("TOP");
      if (event.absY >= DELTA_TOP) {
        setShowCounters(true);
      }
    },
  });

  function printItem(item) {
    return (
      <div className="item" {...swiped}>
        <div
          className="item-picture"
          style={{ backgroundImage: 'url("' + item.image + '")' }}
        >
          <div style={{ flex: 2 }}></div>
          <div className="item-title">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </div>
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
        </div>
      </div>
    );
  }

  if (showCounters) {
    return (
      <div>
        <h3>Debug tool - likes counters</h3>
        <ul>
          {Object.keys(likes)
            .sort((a, b) => (likes[a] > likes[b] ? -1 : 1))
            .map((s) => (
              <li key={s} style={{ textTransform: "capitalize" }}>
                {s} : {likes[s]}
              </li>
            ))}
        </ul>
        <input
          type="button"
          value="Retour"
          onClick={() => {
            setShowCounters(false);
          }}
        />
      </div>
    );
  } else if (ready && items.length > 0) {
    return (
      <div className="container" style={{ height: window.innerHeight }}>
        <div
          className="left-swipping-indicator"
          style={{ opacity: opacityIndicatorLeft }}
        ></div>
        <div
          className="right-swipping-indicator"
          style={{ opacity: opacityIndicatorRight }}
        ></div>
        {printItem(items[cursor])}{" "}
      </div>
    );
  } else {
    return (
      <div className="loading">
        <div className="me">
          <img src={me} alt="avatar" />
          <p>news.besson.tech</p>
        </div>
        <div className="rules">
          <ul>
            <li>
              <span className="right-color">Swipe a droite</span>, si le contenu
              t'interesse.
            </li>
            <li>
              <span className="left-color">Swipe a gauche</span>, si le contenu
              ne t'interesse pas.
            </li>
          </ul>
        </div>
        <div className="action">
          {items.length === 0 && <img src={loading} alt="loading" />}
          {items.length > 0 && (
            <input
              className="start"
              type="button"
              value="Commencer"
              onClick={() => setReady(true)}
            />
          )}
        </div>
      </div>
    );
  }
}

export default App;

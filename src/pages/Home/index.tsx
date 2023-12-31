import { useState } from 'react';
import reactLogo from '@/assets/img/react.svg';
import { Link } from 'react-router-dom';
// eslint-disable-next-line import/no-absolute-path
import viteLogo from '/vite.svg'; // 不应该在源码中引入public目录下的资源
import styles from './style.module.scss';

function Home() {
  const [count, setCount] = useState(0);
  return (
    <div className={styles.container}>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className={styles.logo} alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className={styles.logo} alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className={styles.card}>
        <div className={styles.btnWrapper}>
          <button type="button" onClick={() => setCount((c) => c + 1)}>
            {`count is ${count}`}
          </button>
        </div>
        <p>
          {'Edit '}
          <code>src/App.tsx</code>
          {' and save to test HMR'}
        </p>
      </div>
      <p className={styles.readTheDocs}>
        Click on the Vite and React logos to learn more
      </p>
      <Link to="/setting">Click to page setting</Link>
    </div>
  );
}

export default Home;

import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { decrement, increment, incrementByAmount } from '@/stores/counterSlice';
import { useState } from 'react';

function Setting() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = useState('2');

  return (
    <div>
      <div>This is a Setting Page</div>
      <Link to="/">Click to page home</Link>
      <div style={{ marginTop: '10px', fontSize: '24px' }}>
        <button type="button" onClick={() => dispatch(increment())}>+</button>
        <span>{`  ${count}  `}</span>
        <button type="button" onClick={() => dispatch(decrement())}>-</button>
      </div>
      <div style={{ marginTop: '10px', fontSize: '24px' }}>
        <input
          style={{
            fontSize: '32px',
            padding: '2px',
            width: '64px',
            textAlign: 'center',
            marginRight: '8px',
          }}
          aria-label="Set increment amount"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button
          type="button"
          onClick={() => dispatch(incrementByAmount(Number(incrementAmount) || 0))}
        >
          Add Amount
        </button>
      </div>
    </div>
  );
}

export default Setting;

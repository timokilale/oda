export default function TableLookupForm({ tableInput, onTableInputChange, onSubmit }) {
  return (
    <form className="lookup-form" onSubmit={onSubmit}>
      <div className="field-group">
        <label className="lookup-form__label" htmlFor="table-reference">
          Table reference
        </label>
        <input
          id="table-reference"
          className="lookup-form__input"
          value={tableInput}
          onChange={(event) => onTableInputChange(event.target.value)}
          placeholder="Enter table reference"
          aria-label="Table reference"
        />
      </div>
      <button type="submit" className="order-btn">
        Load menu
      </button>
    </form>
  );
}

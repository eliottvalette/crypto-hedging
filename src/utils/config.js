export const customStyles = {
    control: (provided) => ({
        ...provided,
        width: '100%',
        padding: '0rem',
        border: 'none',
        borderRadius: '8px',
        background: '#12302D', // Updated background color
        color: '#FFFFFF', // Updated text color
        fontSize: '1rem',
        fontFamily: 'Roboto, Arial, sans-serif',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            background: '#1CA37B', // Updated hover background color
        },
        '&:focus': {
            outline: 'none',
            background: '#51D2C1', // Updated focus background color
            color: '#131E22', // Updated focus text color
        },
    }),
    menu: (provided) => ({
        ...provided,
        background: '#12302D', // Updated background color
        color: '#FFFFFF', // Updated text color
    }),
    option: (provided, state) => ({
        ...provided,
        background: state.isSelected ? '#1CA37B' : '#12302D', // Updated selected and default background colors
        color: state.isSelected ? '#131E22' : '#FFFFFF', // Updated selected and default text colors
        '&:hover': {
            background: '#1CA37B', // Updated hover background color
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#FFFFFF', // Updated text color
    }),
    input: (provided) => ({
        ...provided,
        color: '#FFFFFF', // Updated text color
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#F5FEFD', // Updated placeholder color
    }),
};
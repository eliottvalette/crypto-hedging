export const customStyles = {
    control: (provided) => ({
        ...provided,
        width: '100%',
        padding: '0rem',
        border: 'none',
        borderRadius: '8px',
        background: '#2e2e2e',
        color: '#e0e0e0',
        fontSize: '1rem',
        fontFamily: 'Roboto, Arial, sans-serif',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            background: '#3e3e3e',
        },
        '&:focus': {
            outline: 'none',
            background: '#ffab00',
            color: '#121212',
        },
    }),
    menu: (provided) => ({
        ...provided,
        background: '#2e2e2e',
        color: '#e0e0e0',
    }),
    option: (provided, state) => ({
        ...provided,
        background: state.isSelected ? '#ffab00' : '#2e2e2e',
        color: state.isSelected ? '#121212' : '#e0e0e0',
        '&:hover': {
            background: '#3e3e3e',
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#e0e0e0',
    }),
    input: (provided) => ({
        ...provided,
        color: '#e0e0e0',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#e0e0e0',
    }),
};
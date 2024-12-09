export const customStyles = {
    control: (provided) => ({
        ...provided,
        width: '100%',
        padding: '0rem',
        border: 'none',
        borderRadius: '8px',
        background: '#004A37', // Updated background color
        color: '#FFFFFF', // Updated text color
        fontSize: '1rem',
        fontFamily: 'Roboto, Arial, sans-serif',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
            background: '#009D89', // Updated hover background color
        },
        '&:focus': {
            outline: 'none',
            background: '#98FCE4', // Updated focus background color
            color: '#072723', // Updated focus text color
        },
    }),
    menu: (provided) => ({
        ...provided,
        background: '#004A37', // Updated background color
        color: '#FFFFFF', // Updated text color
    }),
    option: (provided, state) => ({
        ...provided,
        background: state.isSelected ? '#009D89' : '#004A37', // Updated selected and default background colors
        color: state.isSelected ? '#072723' : '#FFFFFF', // Updated selected and default text colors
        '&:hover': {
            background: '#009D89', // Updated hover background color
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
        color: '#e0e0e0',
    }),
};
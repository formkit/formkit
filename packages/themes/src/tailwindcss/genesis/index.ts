export default {
  // Global styles apply to _all_ inputs with matching section keys
  global: {
    fieldset: 'max-w-md border border-gray-400 rounded px-2 pb-1',
    help: 'text-xs text-gray-500',
    inner: 'formkit-disabled:bg-gray-200 formkit-disabled:cursor-not-allowed formkit-disabled:pointer-events-none',
    input: 'appearance-none bg-transparent focus:outline-none focus:ring-0 focus:shadow-none',
    label: 'block mb-1 font-bold text-sm',
    legend: 'font-bold text-sm',
    loaderIcon: 'inline-flex items-center w-4 text-gray-600 animate-spin',
    message: 'text-red-500 mb-1 text-xs',
    messages: 'list-none p-0 mt-1 mb-0',
    outer: 'mb-4 formkit-disabled:opacity-50',
    prefixIcon: 'w-10 flex self-stretch grow-0 shrink-0 rounded-tl rounded-bl border-r border-gray-400 bg-white bg-gradient-to-b from-transparent to-gray-200 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto',
    suffixIcon: 'w-7 pr-3 flex self-stretch grow-0 shrink-0 [&>svg]:w-full [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto'
  },

  // Family styles apply to all inputs that share a common family
  'family:box': {
    decorator: 'block relative h-5 w-5 mr-2 rounded bg-white bg-gradient-to-b from-transparent to-gray-200 ring-1 ring-gray-400 peer-checked:ring-blue-500 text-transparent peer-checked:text-blue-500',
    decoratorIcon: 'flex p-[3px] w-full h-full absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2',
    help: 'mb-2 mt-1.5',
    input: 'absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none peer',
    label: '$reset text-sm text-gray-700 mt-1 select-none',
    wrapper: 'flex items-center mb-1',
  },
  'family:button': {
    input: '$reset inline-flex items-center bg-blue-600 text-white text-sm font-normal py-3 px-6 rounded focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 formkit-disabled:bg-gray-400 formkit-loading:before:w-4 formkit-loading:before:h-4 formkit-loading:before:mr-2 formkit-loading:before:border formkit-loading:before:border-2 formkit-loading:before:border-r-transparent formkit-loading:before:rounded-3xl formkit-loading:before:border-white formkit-loading:before:animate-spin',
    wrapper: 'mb-1',
    prefixIcon: '$reset block w-4 -ml-2 mr-2 stretch',
    suffixIcon: '$reset block w-4 ml-2 stretch',
  },
  'family:dropdown': {
    dropdownWrapper: 'my-2 w-full drop-shadow-lg rounded [&::-webkit-scrollbar]:hidden',
    emptyMessageInner: 'flex items-center justify-center text-sm p-2 text-center w-full text-gray-500 [&>span]:mr-3 [&>span]:ml-0',
    inner: 'max-w-md relative flex ring-1 ring-gray-400 focus-within:ring-blue-500 focus-within:ring-2 rounded mb-1 formkit-disabled:focus-within:ring-gray-400 formkit-disabled:focus-within:ring-1 [&>span:first-child]:focus-within:text-blue-500',
    input: 'w-full px-3 py-2',
    listbox: 'bg-white drop-shadow-lg rounded overflow-hidden',
    listboxButton: 'flex w-12 self-stretch justify-center mx-auto',
    listitem: 'pl-7 relative hover:bg-gray-300 data-[is-active="true"]:bg-gray-300 data-[is-active="true"]:aria-selected:bg-blue-600 aria-selected:bg-blue-600 aria-selected:text-white',
    loaderIcon: 'ml-auto',
    loadMoreInner: 'flex items-center justify-center text-sm p-2 text-center w-full text-blue-500 formkit-loading:text-gray-500 cursor-pointer [&>span]:mr-3 [&>span]:ml-0',
    option: 'p-2.5',
    optionLoading: 'text-gray-500',
    placeholder: 'p-2.5 text-gray-400',
    selector: 'flex w-full justify-between items-center [&u]',
    selectedIcon: 'block absolute top-1/2 left-2 w-3 -translate-y-1/2',
    selectIcon: 'flex box-content w-4 px-2 self-stretch grow-0 shrink-0',
  },
  'family:text': {
    inner: 'flex items-center max-w-md ring-1 ring-gray-400 focus-within:ring-blue-500 focus-within:ring-2 [&>label:first-child]:focus-within:text-blue-500 rounded mb-1',
    input: 'w-full px-3 py-2 border-none text-base text-gray-700 placeholder-gray-400',
  },

  // Specific styles apply only to a given input type
  color: {
    inner: 'flex max-w-[5.5em] w-full formkit-prefix-icon:max-w-[7.5em] formkit-suffix-icon:formkit-prefix-icon:max-w-[10em]',
    input: '$reset appearance-none w-full cursor-pointer border-none rounded p-0 m-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none',
    suffixIcon: 'min-w-[2.5em] pr-0 pl-0 m-auto'
  },
  file: {
    fileItem: 'flex items-center text-gray-800 mb-1 last:mb-0',
    fileItemIcon: 'w-4 mr-2 shrink-0',
    fileList: 'shrink grow peer px-3 py-2 formkit-multiple:data-[has-multiple="true"]:mb-6',
    fileName: 'break-all grow text-ellipsis',
    fileRemove: 'relative z-[2] ml-auto text-[0px] hover:text-red-500 pl-2 peer-data-[has-multiple=true]:text-sm peer-data-[has-multiple=true]:text-blue-500 peer-data-[has-multiple=true]:ml-3 peer-data-[has-multiple=true]:mb-2 formkit-multiple:bottom-[0.15em] formkit-multiple:pl-0 formkit-multiple:ml-0 formkit-multiple:left-[1em] formkit-multiple:formkit-prefix-icon:left-[3.75em]',
    fileRemoveIcon: 'block text-base w-3 relative z-[2]',
    inner: 'relative max-w-md cursor-pointer formkit-multiple:[&>button]:absolute',
    input: 'cursor-pointer text-transparent absolute top-0 right-0 left-0 bottom-0 opacity-0 z-[2]',
    noFiles: 'flex w-full items-center px-3 py-2 text-gray-400',
    noFilesIcon: 'w-4 mr-2'
  },
  radio: {
    decorator: 'rounded-full',
    decoratorIcon: 'w-5 p-[5px]'
  },
  range: {
    inner: '$reset flex items-center max-w-md',
    input: '$reset w-full mb-1 h-2 p-0 rounded-full',
    prefixIcon: '$reset w-4 mr-1 flex self-stretch grow-0 shrink-0 [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto',
    suffixIcon: '$reset w-4 ml-1 flex self-stretch grow-0 shrink-0 [&>svg]:max-w-[1em] [&>svg]:max-h-[1em] [&>svg]:m-auto'
  },
  select: {
    inner: 'flex relative max-w-md items-center rounded mb-1 ring-1 ring-gray-400 focus-within:ring-blue-500 focus-within:ring-2 [&>span:first-child]:focus-within:text-blue-500',
    input: 'w-full pl-3 pr-8 py-2 border-none text-base text-gray-700 placeholder-gray-400 formkit-multiple:p-0 data-[placeholder="true"]:text-gray-400 formkit-multiple:data-[placeholder="true"]:text-inherit',
    selectIcon: 'flex p-[3px] shrink-0 w-5 mr-2 -ml-[1.5em] h-full pointer-events-none',
    option: 'formkit-multiple:p-3 formkit-multiple:text-sm text-gray-700'
  },
  textarea: {
    inner: 'flex max-w-md rounded mb-1 ring-1 ring-gray-400 focus-within:ring-blue-500 [&>label:first-child]:focus-within:text-blue-500',
    input: 'block w-full h-32 px-3 py-3 border-none text-base text-gray-700 placeholder-gray-400 focus:shadow-outline',
  },

  // PRO input styles
  autocomplete: {
    closeIcon: 'block grow-0 shrink-0 w-3 mr-3.5',
    inner: '[&>div>[data-value]]:absolute [&>div>[data-value]]:mb-0',
    option: 'grow text-ellipsis',
    selection: 'static flex left-0 top-0 right-0 bottom-0 mt-0 mb-2 rounded bg-gray-100',
  },
  rating: {
    inner: 'relative flex items-center w-[8em] formkit-disabled:bg-transparent',
    itemsWrapper: 'w-full',
    onItems: 'text-yellow-400',
    onItemWrapper: '[&>*]:w-full [&>svg]:h-auto [&>svg]:max-w-none [&>svg]:max-h-none',
    offItems: 'text-gray-500',
    offItemWrapper: '[&>*]:w-full [&>svg]:h-auto [&>svg]:max-w-none [&>svg]:max-h-none'
  },
  repeater: {
    content: 'grow p-3 flex flex-col align-center',
    controlLabel: 'absolute opacity-0 pointer-events-none',
    controls: 'flex flex-col items-center justify-center bg-gray-100 p-3',
    downControl: 'hover:text-blue-500 disabled:hover:text-inherit disabled:opacity-25',
    fieldset: 'py-4 px-5',
    help: 'mb-2 mt-1.5',
    item: 'flex w-full mb-1 rounded border border-gray-200',
    moveDownIcon: 'block w-3 my-1',
    moveUpIcon: 'block w-3 my-1',
    removeControl: 'hover:text-blue-500 disabled:hover:text-inherit disabled:opacity-25',
    removeIcon: 'block w-5 my-1',
    upControl: 'hover:text-blue-500 disabled:hover:text-inherit disabled:opacity-25'
  },
  taglist: {
    input: 'px-1 py-1 w-[0%] grow',
    removeSelection: 'w-2.5 mx-1 self-center text-black leading-none',
    tag: 'flex items-center my-1 p-1 bg-gray-200 text-xs rounded-full',
    tagWrapper: 'mr-1 focus:outline-none focus:text-white [&>div]:focus:bg-blue-500 [&>div>button]:focus:text-white',
    tagLabel: 'pl-2 pr-1',
    tags: 'flex items-center flex-wrap w-full py-1.5 px-2',
  },
  toggle: {
    altLabel: 'block w-full mb-1 font-bold text-sm',
    inner: '$reset inline-block mr-2',
    input: 'peer absolute opacity-0 pointer-events-none',
    innerLabel: 'text-[10px] font-bold absolute left-full top-1/2 -translate-x-full -translate-y-1/2 px-1',
    thumb: 'relative left-0 aspect-square rounded-full transition-all w-5 bg-gray-100',
    track: 'p-0.5 min-w-[3em] relative rounded-full transition-all bg-gray-400 peer-checked:bg-blue-500 peer-checked:[&>div:last-child]:left-full peer-checked:[&>div:last-child]:-translate-x-full peer-checked:[&>div:first-child:not(:last-child)]:left-0 peer-checked:[&>div:first-child:not(:last-child)]:translate-x-0',
    valueLabel: 'font-bold text-sm',
    wrapper: 'flex flex-wrap items-center mb-1'
  },
  transferlist: {
    outer: `
      [&_.dnd-placeholder]:bg-blue-500 [&_.dnd-placeholder]:text-white
      [&_.dnd-placeholder_svg]:text-white
      [&_.dnd-children-hidden]:w-full [&_.dnd-children-hidden]:p-0 [&_.dnd-children-hidden]:flex [&_.dnd-children-hidden]:flex-col [&_.dnd-children-hidden]:border-none
      [&_.dnd-children-hidden_span]:hidden
      [&_.dnd-children-hidden_.formkit-transferlist-option]:hidden
      [&_.dnd-multiple-selections_span]:inline-block
      [&_.dnd-multiple-selections_.formkit-transferlist-option]:inline-block
    `,
    fieldset: '$reset max-w-2xl',
    wrapper: 'flex max-h-[350px] flex-col sm:flex-row justify-between w-full max-w-none',
    help: 'pb-2',
    transferlist: 'sm:w-3/5 shadow-md flex flex-col min-h-[350px] max-h-[350px] border rounded overflow-hidden select-none bg-gray-50',
    transferlistHeader: 'flex bg-gray-100 justify-between items-center border-b p-3',
    transferlistHeaderItemCount: 'ml-auto text-sm',
    transferlistListItems: 'list-none bg-gray-50 h-full sm:max-w-xs overflow-x-hidden overflow-y-auto',
    transferlistListItem: 'pl-8 relative aria-selected:bg-blue-600 aria-selected:data-[is-active=true]:bg-blue-600 aria-selected:text-white aria-selected:data-[is-active=true]:text-white first:-mt-px first:border-t py-2 px-3 flex relative border-b bg-white data-[is-active=true]:text-blue-500 data-[is-active=true]:bg-gray-100 cursor-pointer group-data-[is-max=true]:cursor-not-allowed items-center',
    transferlistOption: 'text-sm',
    transferControls: 'flex sm:flex-col justify-center mx-auto my-2 sm:mx-2 sm:my-auto border rounded',
    transferlistButton: 'text-sm disabled:cursor-not-allowed disabled:bg-gray-200 disabled:opacity-50 first:rounded-l last:rounded-r sm:first:rounded-t sm:last:rounded-b appearance-none p-2 m-0 cursor-pointer h-10 border-none rounded-none bg-gray-50 hover:outline disabled:hover:outline-none hover:outline-1 hover:outline-black hover:text-blue-500 disabled:hover:text-current hover:z-10',
    sourceEmptyMessage: 'appearance-none border-none w-full p-0 m-0 text-center text-gray-500 italic',
    sourceListItems: 'group-data-[is-max=true]:opacity-50',
    targetEmptyMessage: 'appearance-none border-none w-full p-0 m-0 text-center text-gray-500 italic',
    emptyMessageInner: 'flex items-center justify-center p-2 text-sm',
    transferlistControls: 'bg-white px-3 py-2 border-b',
    transferlistSearch: 'flex border rounded items-center',
    transferlistSearchInput: 'border-none p-1 w-full bg-transparent outline-none text-sm',
    controlLabel: 'hidden',
    selectedIcon: 'w-3 absolute left-3 select-none',
    fastForwardIcon: 'w-10 flex select-none [&>svg]:m-auto [&>svg]:w-full [&>svg]:max-w-[1rem] [&>svg]:max-h-[1rem] rotate-90 sm:rotate-0',
    moveRightIcon: 'w-10 flex select-none [&>svg]:m-auto [&>svg]:w-full [&>svg]:max-w-[1rem] [&>svg]:max-h-[1rem] rotate-90 sm:rotate-0',
    moveLeftIcon: 'w-10 flex select-none [&>svg]:m-auto [&>svg]:w-full [&>svg]:max-w-[1rem] [&>svg]:max-h-[1rem] rotate-90 sm:rotate-0',
    rewindIcon: 'w-10 flex select-none [&>svg]:m-auto [&>svg]:w-full [&>svg]:max-w-[1rem] [&>svg]:max-h-[1rem] rotate-90 sm:rotate-0',
  }
}

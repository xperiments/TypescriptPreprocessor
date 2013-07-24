.LibraryNameSheet
{
    background-repeat: no-repeat;
    background-image: url( {{{libraryImage}}} );
}
{{#each members}}
.LibraryNameSheet.{{@index}}
{
    background-position: {{{x}}}px {{{y}}}px;
    width:{{{w}}}px;
    height:{{{h}}}px;
}
{{/each}}


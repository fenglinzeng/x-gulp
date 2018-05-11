define('entry/index', [], require => {
    console.log('ok');
    const categoryPop = $('.category-pop');
    const category = $('#category');
    category.on('mousemove', '.cat-item', function() {
        const id = $(this).index();
        // console.log($(this));
        console.log(id);
        categoryPop.hide().eq(id).show();
    }).on('mouseout', () => {
        categoryPop.hide();
    });
});
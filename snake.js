
window.onload = function()
{
    let game = (new Game({speed: 100, width: 25, height: 25, target: 'snake'}));
    game.run();

    document.addEventListener('keydown', function(event) {
        game.onKey(event.code);
    });
    
}

function random_int(n1, n2)
{
    return n1 + Math.floor(Math.random()*(n2 - n1))
}


class Game {
    constructor(options) {
        // speed, width, height, target
        this.options = options;
        options.canvas = document.getElementById(this.options.target+'_canvas');

        this.directions = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
        }

        
        this.fruits = ['green', 'blue', 'white'];
        
        let cssStyles = window.getComputedStyle(document.body);
        
        let styles = this.styles = {};
        this.fruits.map(fr => {
            styles['snake-'+fr] = cssStyles.getPropertyValue(`--snake-${fr}-color`);
            styles[fr] = cssStyles.getPropertyValue(`--${fr}-color`);
        })
        
        styles['head'] = cssStyles.getPropertyValue('--snake-head-color');

        styles['empty'] = cssStyles.getPropertyValue('--empty-color');
        
        styles['border'] = cssStyles.getPropertyValue('--cell-border-color');
        styles['snake-bg'] = cssStyles.getPropertyValue('--snake-bg-color');

        options.styles = styles;

        this.loadImages();

        
        this.map = new GameMap (options);
        this.snake = new Snake (options);
    }

    loadImages()
    {
        let images_urls = [
            ['white', 'white-img'],
            ['green', 'green-img'],
            ['blue',  'blue-img'],
            ['head',  'head-img'],
        ];

        let opts = this.options;

        let img_opts = 
        {
            resizeWidth: opts.canvas.width/opts.width,
            resizeHeight: opts.canvas.height/opts.height,
        };

        let images_load = 
          images_urls.map(img_descr => {
              let img = document.getElementById(img_descr[1]);
              return createImageBitmap(img, img_opts);
          });

        Promise.all(images_load).then(sprites=>{
            images_urls.map((img_descr, n)=>
                opts.styles[img_descr[0]] = sprites[n])
        });

    }

    run()
    {
        this.generateFruit();
        this.render();
    }

    generateFruit()
    {
        setTimeout(()=>{
            let fruit = this.fruits[ random_int(0, this.fruits.length) ];

            let cell = this.map.randomEmptyCell();

            cell.setType(fruit);
            cell.render();

            // console.log(cell);

            // this.map.placeFruit(new Cell({type: 'fruit', x: }))      
            this.generateFruit()

         }, random_int(2, 5)*100);        
    }

    onKey(code)
    {
        this.snake.turn(this.directions[code]);
        // console.log(code);
    }

    render()
    {
        setTimeout(()=>{
            window.requestAnimationFrame(()=>{
                this.map.clearSnake(this.snake);
            
                if(!this.snake.move(this.map))
                {
                    this.snake.reset();
                }
    
                this.map.render(this.snake);
            });

            this.render();
         }, this.options.speed);
    }
}

class GameMap
{
    constructor(options) {
        // speed, width, height, target
        this.options = options;

        this.canvas = options.canvas;
        this.context = this.canvas.getContext('2d');

        this.clearMap();
    }

    clearMap()
    {
        this.map = [];
        let options = this.options;

        for(let y=0; y<options.width; ++y)
        {
            this.map[y] = [];
            for(let x=0; x<options.width; ++x)
                this.map[y][x] = new Cell({x, y, 
                    width: options.width,
                    height: options.height,
                    styles: options.styles,
                    canvas: this.canvas,
                    context: this.context,
                });
        }

        this.map.map(row => row.map(cell => cell.render()));
    }

    randomEmptyCell()
    {
        return this.cell(random_int(0, this.options.width), 
                         random_int(0, this.options.height));
    }

    cell(x, y)
    {
        // console.log('XY', x, y);
        return this.map[y][x];
    }

    clearSnake (snake)
    {
        snake.body.map(body => {
            let cell = this.cell(body.options.x, body.options.y)
            cell.setType('empty');
            cell.render();
        })
    }
    render (snake)
    {
        // console.log(snake.body);
        snake.body.map(body => {
            let cell = this.cell(body.options.x, body.options.y)
            cell.setType(body.type);
            cell.render();
        })
    }

}

class Cell 
{
    constructor(options) {
        // speed, width, height, target, x, y
        this.options = options;
        this.canvas = options.canvas || null;
        this.context = options.context || null;
        this.type = options.type || 'empty';
    }

    get x() { return this.options.x; }
    get y() { return this.options.y; }

    clear ()
    {
        this.setType('empty');
    }

    setType(type)
    {
        this.type = type;
    }

    render ()
    {
        let opts = this.options;
        let ctx = this.context;

        if(this.canvas)
        {
            let cell_width = this.canvas.width/opts.width;
            let cell_height = this.canvas.height/opts.height;
            // console.log(cell_width, cell_height);
            
            let [x, y, w, h] = [this.x*cell_width, this.y*cell_height, 
                cell_width, cell_height
            ];

            let [rx, ry] = [w/2, h/2];

            let fillStyle = opts.styles[this.type];

            if(this.type.indexOf('snake') === 0 || this.type==='head')
            {
                ctx.fillStyle = opts.styles['snake-bg'];
                ctx.fillRect(x, y, w, h);

                if(typeof fillStyle === 'string')
                {
                    ctx.fillStyle = fillStyle;
                    ctx.beginPath();
                    ctx.ellipse(x+rx, y+ry, rx, ry, 0, 0, 2*Math.PI);
                    ctx.fill();
                }
                else
                {
                    // console.log(fillStyle);
                    ctx.drawImage(fillStyle, x, y);
                }
            }
            else
            {
                if(typeof fillStyle === 'string')
                {
                    ctx.fillStyle = fillStyle;
                    ctx.fillRect(x, y, w, h);
                }
                else
                {
                    ctx.drawImage(fillStyle, x, y);
                }
            }

            ctx.strokeStyle = opts.styles['border'];
            ctx.strokeRect(x, y, w, h);
        }
    }    

}

class Snake
{
    constructor(options) {
        // speed, width, height, target
        this.options = options;
        this.reset();
    }

    move(map)
    {
        // console.log(this.body[0]);
        let body = this.body;
        let head = body[0];
        let {width, height} = map.options;
        let [x, y] = [(width  + head.options.x + this.direction[0]) % width, 
                      (height + head.options.y + this.direction[1]) % height
                    ];
        // console.log(x, y);
        let isOk = !this.checkIsSnake(x, y);

        if(isOk && x>=0 && x < width && y >= 0 && y < height)
        {
            for(let b = body.length-1; b >= 1; --b )
            {
                body[b].options.x = body[b-1].x;
                body[b].options.y = body[b-1].y;
            }

            let cell = map.cell(x, y);
            if(cell.type != 'empty')
            {
                // console.log('CELL!!!', cell);
                this.eat(cell);
            }

            if(isOk)
            {
                head.options.x = x;
                head.options.y = y;
            }
        }
        else isOk = false;

        return isOk;
    }

    checkIsSnake(x, y)
    {
        for (let i=0; i<this.body.length; ++i)
        {
            let b = this.body[i];
            if(x===b.x && y===b.y) 
                return true;
        }

        return false;
    }

    eat(cell)
    {
        this.body.push(new Cell({ x: cell.x, y: cell.y, type: 'snake-'+cell.type }));
    }

    turn(direction)
    {
        if(direction)
            this.direction = direction;
    }

    reset()
    {
        let opts = this.options;
        this.body = [ new Cell({type: 'head', 
            x: Math.floor(opts.width/2), 
            y: Math.floor(opts.height/2)}) ];
        this.direction = [0, -1];
    }
}

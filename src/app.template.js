module.exports = `
    <div id="app">
      <div class="choose-file" v-if="!isStreamAnalyzed">
        <md-icon class="md-size-2x md-primary">arrow_downward</md-icon>
        <h1>Drag and drop files here</h1>
        <p>or use the input field below</p>
        <md-input-container>
          <label>Local CSV or XML file</label>
          <md-file @change.native="analyzeFiles"></md-file>
        </md-input-container>
        <p>or paste a link</p>
        <md-input-container :class="{'md-input-invalid': httpError.message}">
          <label>Link to CSV or XML file</label>
          <md-input v-model="url" @blur.native="analyzeUrl"></md-input>
          <md-icon style="cursor: pointer;">link</md-icon>
          <span class="md-error">{{ httpError.message }}</span>
        </md-input-container>
      </div>

      <div class="sidebar" v-if="isStreamAnalyzed">
        <md-toolbar>
          <h2 class="something-like-logo" style="flex: 1">I>&nbsp;&nbsp;infodiz</h2>
          <md-button class="md-primary md-raised" v-on:click.native="open">
            Open
          </md-button>
        </md-toolbar>
       
        <md-list>
        
        <!-- FILTER/SEARCH -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">filter_list</md-icon>
          <div class="md-subheading">Filter (Search)</div>
          <md-list-expand>
            <md-card>
              <md-card-content>
                <md-input-container>
                  <label>Search string</label>
                  <md-input v-model="search"></md-input>
                </md-input-container>
                <md-input-container>
                  <label for="search-column">Search in columns</label>
                  <md-select name="search-column" id="search-column" v-model="searchColumn">
                    <md-option v-for="column in columns" :value="column" :key="column">{{ column }}</md-option>
                  </md-select>
                </md-input-container>
                <md-checkbox id="strict-search" name="strict-search" v-model="strictSearch" class="md-primary">Strict search</md-checkbox>
              </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        <!-- RESTRUCTURE -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">device_hub</md-icon>
          <div class="md-subheading">Restructure</div>
          <md-list-expand>
            <md-card>
              <md-card-content>
                <md-checkbox id="structure-showall" name="structure-showall" v-model="structure.showAll" class="md-primary">Keep all fields</md-checkbox>
                <md-input-container v-if="!structure.showAll">
                  <label for="structure">Structure</label>
                  <md-select name="structure" id="structure" multiple v-model="structure.newColumns">
                    <md-option v-for="column in columns" :value="column" :key="column">{{ column }}</md-option>
                  </md-select>
                </md-input-container>
              </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        <!-- PLOT STREAM -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
            <md-icon class="md-primary">bubble_chart</md-icon>
            <div class="md-subheading">Plot stream</div>
            <md-list-expand>
              <md-card>
                <md-card-content>
                  <md-checkbox id="plot-display" name="plot-display" v-model="plotStream.display" class="md-primary">Visualize plot</md-checkbox>
                  <div v-if="plotStream.display">
                    <h4>X axis</h4>
                    <md-input-container>
                      <label for="x-column">Select column for X</label>
                      <md-select name="x-column" id="x-column" v-model="plotStream.data.xColumn">
                        <md-option v-for="column in columns" :value="column" :key="column">{{ column }}</md-option>
                      </md-select>
                    </md-input-container>

                    <md-input-container md-inline>
                        <md-input name="x-min" id="x-min" type="number" placeholder="X-min" v-model="plotStream.data.xRange.min"></md-input>
                        <md-input name="x-max" id="x-max" type="number" placeholder="X-max" v-model="plotStream.data.xRange.max"></md-input>
                    </md-input-container>

                    <h4>Y axis</h4>

                    <md-input-container>
                      <label for="y-column">Select column for Y</label>
                      <md-select name="y-column" id="y-column" v-model="plotStream.data.yColumn">
                        <md-option v-for="column in columns" :value="column" :key="column">{{ column }}</md-option>
                      </md-select>
                    </md-input-container>

                    <md-input-container md-inline>
                        <md-input name="y-min" id="y-min" type="number" placeholder="Y-min" v-model="plotStream.data.yRange.min"></md-input>
                        <md-input name="y-max" id="y-max" type="number" placeholder="Y-max" v-model="plotStream.data.yRange.max"></md-input>
                    </md-input-container>
                  </div>
                </md-card-content>
              </md-card>
            </md-list-expand>
        </md-list-item>

        <!-- ANALYSIS -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">functions</md-icon>
          <div class="md-subheading">Analysis</div>
          <md-list-expand>
            <md-card>
              <md-card-content>
                <!-- Add new stat menu -->
                <md-menu md-direction="bottom left" md-size="4">
                  <md-button md-menu-trigger>
                    <md-icon>add</md-icon>
                    Add function
                  </md-button>
                  <md-menu-content>
                    <md-menu-item v-for="type in statTypes" :key="type" v-on:click.native="addStat(type)">
                      <span> {{ type }}</span>
                      <md-icon>add_circle_outline</md-icon>
                    </md-menu-item>
                  </md-menu-content>
                </md-menu>

                <!-- Stat blocks -->
                <md-card class="stat-card md-primary" v-for="(stat,index) in stats" :key="stat.name">
                  <md-card-header>
                    <md-card-header-text>
                      <div class="md-subhead"> {{ stat.name }} </div>
                    </md-card-header-text>
                    <md-menu md-size="4" md-direction="bottom left">
                      <md-button class="md-icon-button" md-menu-trigger>
                        <md-icon>more_vert</md-icon>
                      </md-button>
                      <md-menu-content>
                        <md-menu-item v-on:click.native="removeStat(index)">
                          <span>Remove</span>
                          <md-icon>delete</md-icon>
                        </md-menu-item>
                      </md-menu-content>
                    </md-menu>
                  </md-card-header>
                  <md-card-content>
                    <md-input-container v-for="(input,index) in stat.inputColumns" :key="index">
                      <label>Select input ({{ index }})</label>
                      <md-select v-model="stat.inputColumns[index]">
                        <md-option v-for="column in columns" v-bind:value="column" :key="column">{{ column }}</md-option>
                      </md-select>
                    </md-input-container>
                  </md-card-content>
                </md-card>
              </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        <!-- CHARTS -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">equalizer</md-icon>
          <div class="md-subheading">Charts</div>
          <md-list-expand>
            <md-card>
            <md-card-content>
              <!-- Add new chart menu -->
              <md-menu md-direction="bottom left" md-size="4">
                <md-button class="md-icon-button" md-menu-trigger>
                  <md-icon>add</md-icon>
                </md-button>
                <md-menu-content>
                  <md-menu-item v-for="type in chartTypes" :key="type" v-on:click.native="addChart(type)">
                    <span> {{ type }}</span>
                    <md-icon>add_circle_outline</md-icon>
                  </md-menu-item>
                </md-menu-content>
              </md-menu>

              <!-- Chart blocks -->
              <md-card class="stat-card md-primary" v-for="(chart, index) in charts" :key="chart.name">
                <md-card-header>
                  <md-card-header-text>
                    <div class="md-subhead"> {{ chart.name }} </div>
                  </md-card-header-text>
                  <md-menu md-size="4" md-direction="bottom left">
                    <md-button class="md-icon-button" md-menu-trigger>
                      <md-icon>more_vert</md-icon>
                    </md-button>
                    <md-menu-content>
                      <md-menu-item v-on:click.native="removeChart(index)">
                        <span>Remove</span>
                        <md-icon>delete</md-icon>
                      </md-menu-item>
                    </md-menu-content>
                  </md-menu>
                </md-card-header>
                <md-card-content>
                  <!-- Select collection -->
                  <md-input-container>
                    <label>Select collection</label>
                    <md-select v-model="chart.inputCollection">
                      <md-option v-for="(collection, collectionName) in collections" :key="collectionName" :value="collectionName">{{ collectionName }}</md-option>
                    </md-select>
                  </md-input-container>
                  <!-- Select column of labels and values -->
                  <div v-if="chart.inputCollection">
                    <md-input-container>
                      <label>Select labels</label>
                      <md-select v-model="chart.labelColumn">
                        <md-option v-for="(column, columnName) in collections[chart.inputCollection].records" :key="columnName" :value="columnName">{{ columnName }}</md-option>
                      </md-select>
                    </md-input-container>
                    <md-input-container>
                      <label>Select values</label>
                      <md-select v-model="chart.inputColumn">
                        <md-option v-for="(column, columnName) in collections[chart.inputCollection].records" :key="columnName" :value="columnName">{{ columnName }}</md-option>
                      </md-select>
                    </md-input-container>
                  </div>
                </md-card-content>
              </md-card>

            </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        <!-- TABLE -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">view_list</md-icon>
          <div class="md-subheading">Table (slow)</div>
          <md-list-expand>
            <md-card>
              <md-card-content>
                <md-checkbox v-for="(collection, collectionName) in collections" v-model="collection.display" :key="collectionName" :name="collectionName + '-display'" class="md-primary">Display {{ collectionName }} collection</md-checkbox>
              </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        <!-- OUTPUT -->
        <md-list-item :md-expand-multiple="true" :class="{hidden: isStreamLoadingNow}">
          <md-icon class="md-primary">file_download</md-icon>
          <div class="md-subheading">Save</div>
          <md-list-expand>
            <md-card>
              <md-card-content>
                <md-checkbox v-for="(collection, collectionName) in collections" v-model="collection.save" :key="collectionName" :name="collectionName + '-save'" class="md-primary">Save {{ collectionName }} collection</md-checkbox>
              </md-card-content>
            </md-card>
          </md-list-expand>
        </md-list-item>

        </md-list>
        <md-button v-if="!isStreamLoadingNow && !wasStreamLoaded" class="md-raised md-primary control-button" v-on:click.native="reloadStream"><md-icon>play_arrow</md-icon> Run</md-button>
        <md-button v-if="isStreamLoadingNow" v-on:click.native="stopStream" class="md-raised md-accent control-button"><md-icon>stop</md-icon> Stop</md-button>
        <md-button v-if="!isStreamLoadingNow && wasStreamLoaded" v-on:click.native="reloadStream" class="md-raised md-primary control-button"><md-icon>replay</md-icon> Rerun</md-button>
      </div>

      <div class="content" v-if="isStreamAnalyzed">
        <md-button v-if="url.length" class="md-fab md-primary md-fab-top-right" id="fab" @click.native="generateLink()">
          <md-icon>share</md-icon>
          <md-tooltip md-direction="bottom">Generate link</md-tooltip>
        </md-button>
        <div id="loading" v-bind:style="{width: w + '%'}" v-if="isStreamLoadingNow"></div>
        <h1 id="counter">{{ streamName }}</h1>
        <span class="md-caption">{{ streamInfo }}</span>
        <p id="processed" v-if="fileSize">Processed: <b>{{ (100*processed/fileSize).toFixed(0) }}%</b> ({{ (processed/1024).toFixed(1) }}K of {{ (fileSize/1024).toFixed(1) }}K)</p>
        <p v-if="total"> Total: {{ total }} </p>
        <md-chips v-model="searchArr" v-if="searchArr.length" class="search-chips" md-static>
          <template scope="chip">{{ chip.value }}</template>
        </md-chips>

        <div class="plotStream" v-if="plotStream.display">
          <canvas id="canvas" v-bind:width="plotStream.xSize" v-bind:height="plotStream.ySize"></canvas>
        </div>

        <div v-for="(collection, collectionName) in collections" :key="collectionName" v-if="collection.display || collection.save">
          <h3>Collection: <strong class="primary-color">{{ collection.name }}</strong></h3>
          <chartist
              v-for="chart in charts"
              :key="chart.name"
              v-if="(collection.length > 1) && (chart.inputCollection == collectionName) && (chart.type != 'Pie')"
              ratio="ct-major-second"
              :type="chart.type"
              :data="{labels:collection.records[chart.labelColumn], series:[collection.records[chart.inputColumn]]}"
              :options="chartOptions"
              style="max-width: 400px" >
          </chartist>
          <chartist
              v-for="chart in charts"
              :key="chart.name"
              v-if="(collection.length > 1) && (chart.inputCollection == collectionName) && (chart.type == 'Pie')"
              ratio="ct-major-second"
              :type="chart.type"
              :data="{labels:collection.records[chart.labelColumn], series:collection.records[chart.inputColumn]}"
              :options="chartOptions"
              style="max-width: 400px" >
          </chartist>
          <table v-if="collection.display && collection.length > 0">
            <thead>
              <tr>
                <th></th>
                <th v-for="(columnValues, columnName) in collection.records">
                  {{ columnName }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="index in collection.length" :key="index">
                <td style="color:#AAA; font-size:11px; border: 0; text-align: right; padding-right: 10px;"> {{ index }} </td>
                <td v-for="(columnValues,columnName) in collection.records">
                  {{ columnValues[index-1] }}
                </td>
              </tr>
            </tbody>
          </table>
          <md-button class="md-raised md-dense" v-if="collection.length && collection.save" v-on:click.native="save(collectionName,'csv')"><md-icon class="primary-color">file_download</md-icon> Save to CSV</md-button>
          <md-button class="md-raised md-dense" v-if="collection.length && collection.save" v-on:click.native="save(collectionName,'json')"><md-icon class="primary-color">file_download</md-icon> Save to JSON</md-button>
        </div>
        <p id="size"></p>
        <p id="text"></p>
        <textarea id="query" v-if="url.length" rows="5">{{ newQuery }} </textarea>
      </div>
      <md-snackbar md-position="bottom center" ref="snackbar" md-duration="3000">
        <span>{{ notifyMessage }}</span>
        <md-button class="md-accent" md-theme="light-blue" @click.native="$refs.snackbar.close()">Retry</md-button>
      </md-snackbar>
    </div>
`
